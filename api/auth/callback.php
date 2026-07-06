<?php
/**
 * Fichier: api/auth/callback.php
 * Reçoit le code OAuth et l'échange contre un token
 * Stocke le token en cookie HttpOnly
 */

session_start();

// Fonction pour obtenir l'URL complète en tenant compte du reverse proxy
function getFullUrl() {
    // Déterminer le protocole
    $protocol = 'http';
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        $protocol = $_SERVER['HTTP_X_FORWARDED_PROTO'];
    } elseif (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        $protocol = 'https';
    }
    
    // Déterminer le host
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    if (!empty($_SERVER['HTTP_X_FORWARDED_HOST'])) {
        $host = $_SERVER['HTTP_X_FORWARDED_HOST'];
    }
    
    return "{$protocol}://{$host}";
}

// Configuration OAuth
$clientId = '0a0c7a402e4f4b169d1e32a3c1046320';
$clientSecret = '9f674ddd2bf240c594b6edf42c79717a';
$tokenUrl = 'https://data.bretagne.bzh/oauth2/token/'; // Avec slash à la fin!
$baseUrl = getFullUrl();
$redirectUri = $baseUrl . '/api/auth/callback'; // Sans .php grâce à .htaccess

// Récupérer le code et l'état
$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;
$storedState = $_SESSION['oauth_state'] ?? null;

// Frontend URL pour redirection
$frontendUrl = $baseUrl;

// Log pour debug
error_log("🔐 [CALLBACK] Base URL: {$baseUrl}");
error_log("🔐 [CALLBACK] Redirect URI: {$redirectUri}");
error_log("🔐 [CALLBACK] State reçu: {$state}");
error_log("🔐 [CALLBACK] State en session: {$storedState}");
error_log("🔐 [CALLBACK] Code OAuth: " . substr($code ?? '', 0, 10) . "...");

try {
    // Vérifier l'état CSRF
    if ($state !== $storedState) {
        error_log("❌ OAuth: État CSRF invalide (reçu: $state, attendu: $storedState)");
        header('Location: ' . $frontendUrl . '?auth=error&message=csrf_failed');
        exit;
    }

    if (!$code) {
        error_log("❌ OAuth: Code manquant");
        header('Location: ' . $frontendUrl . '?auth=error&message=missing_code');
        exit;
    }

    error_log("📦 Code OAuth reçu: " . substr($code, 0, 10) . "...");

    // Échanger le code contre un token
    $postData = http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $code,
        'redirect_uri' => $redirectUri,
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);

    // Utiliser cURL pour la requête
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_POSTREDIR, 3);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if (empty($response) || $httpCode >= 400) {
        error_log("❌ OAuth: Erreur lors de l'échange du code (HTTP $httpCode: $curlError)");
        header('Location: ' . $frontendUrl . '?auth=error&message=token_exchange_failed');
        exit;
    }

    $tokenData = json_decode($response, true);

    if (!isset($tokenData['access_token'])) {
        error_log("❌ OAuth: Token manquant dans la réponse");
        header('Location: ' . $frontendUrl . '?auth=error&message=missing_token');
        exit;
    }

    $accessToken = $tokenData['access_token'];
    error_log("✅ OAuth: Token reçu - " . substr($accessToken, 0, 10) . "...");

    // Stocker le token en cookie HttpOnly
    $isSecure = !empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ||
                (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
    $cookieDomain = !empty($_SERVER['HTTP_X_FORWARDED_HOST']) ? $_SERVER['HTTP_X_FORWARDED_HOST'] : $_SERVER['HTTP_HOST'];
    setcookie('oauth_token', $accessToken, time() + (24 * 60 * 60), '/', $cookieDomain, $isSecure, true);

    error_log("🎉 OAuth: Authentification réussie");

    // Rediriger vers l'accueil
    header('Location: ' . $frontendUrl . '?auth=success');
    exit;

} catch (Exception $e) {
    error_log("❌ OAuth: Exception - " . $e->getMessage());
    header('Location: ' . $frontendUrl . '?auth=error&message=' . urlencode($e->getMessage()));
    exit;
}
?>
