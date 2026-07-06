<?php
/**
 * Fichier: api/auth/callback.php
 * Reçoit le code OAuth et l'échange contre un token
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
$tokenUrl = 'https://data.bretagne.bzh/oauth2/token';
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
        error_log("❌ État CSRF invalide");
        header('Location: ' . $frontendUrl . '?auth=error&message=CSRF_validation_failed');
        exit;
    }

    if (!$code) {
        error_log("❌ Code OAuth manquant");
        header('Location: ' . $frontendUrl . '?auth=error&message=Missing_OAuth_code');
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

    error_log("📤 POST Data: " . $postData);
    error_log("📤 Token URL: " . $tokenUrl);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $postData,
            'timeout' => 10
        ]
    ]);

    // Supprimer les avertissements et capturer la vraie erreur
    $response = @file_get_contents($tokenUrl, false, $context);
    
    // Capturer les métadonnées de la réponse HTTP
    $httpInfo = $http_response_header ?? [];
    error_log("📥 HTTP Headers: " . json_encode($httpInfo));
    
    if ($response === false) {
        error_log("❌ Erreur lors de la requête au serveur de token");
        error_log("❌ HTTP Response: " . print_r($http_response_header, true));
        header('Location: ' . $frontendUrl . '?auth=error&message=Token_request_failed');
        exit;
    }

    error_log("📥 Token Response: " . $response);

    $tokenData = json_decode($response, true);

    if (!isset($tokenData['access_token'])) {
        error_log("❌ Token manquant dans la réponse: " . json_encode($tokenData));
        header('Location: ' . $frontendUrl . '?auth=error&message=Missing_access_token');
        exit;
    }

    $accessToken = $tokenData['access_token'];
    error_log("✅ Token reçu: " . substr($accessToken, 0, 10) . "...");

    // Stocker le token en cookie HttpOnly
    $isSecure = !empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ||
                (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
    $cookieDomain = !empty($_SERVER['HTTP_X_FORWARDED_HOST']) ? $_SERVER['HTTP_X_FORWARDED_HOST'] : $_SERVER['HTTP_HOST'];
    setcookie('oauth_token', $accessToken, time() + (24 * 60 * 60), '/', $cookieDomain, $isSecure, true);

    error_log("🎉 Authentification réussie");

    // Rediriger vers l'accueil avec succès
    header('Location: ' . $frontendUrl . '?auth=success');
    exit;

} catch (Exception $e) {
    error_log("❌ Erreur dans le callback OAuth: " . $e->getMessage());
    header('Location: ' . $frontendUrl . '?auth=error&message=' . urlencode($e->getMessage()));
    exit;
}
?>
