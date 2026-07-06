<?php
/**
 * Fichier: api/auth/callback.php
 * Reçoit le code OAuth et l'échange contre un token
 */

session_start();

// Configuration OAuth
$clientId = '0a0c7a402e4f4b169d1e32a3c1046320';
$clientSecret = '9f674ddd2bf240c594b6edf42c79717a';
$tokenUrl = 'https://data.bretagne.bzh/oauth2/token';
$redirectUri = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://{$_SERVER['HTTP_HOST']}/api/auth/callback.php";

// Récupérer le code et l'état
$code = $_GET['code'] ?? null;
$state = $_GET['state'] ?? null;
$storedState = $_SESSION['oauth_state'] ?? null;

// Frontend URL pour redirection
$frontendUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://{$_SERVER['HTTP_HOST']}";

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

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $postData,
            'timeout' => 10
        ]
    ]);

    $response = file_get_contents($tokenUrl, false, $context);
    
    if ($response === false) {
        error_log("❌ Erreur lors de la requête au serveur de token");
        header('Location: ' . $frontendUrl . '?auth=error&message=Token_request_failed');
        exit;
    }

    $tokenData = json_decode($response, true);

    if (!isset($tokenData['access_token'])) {
        error_log("❌ Token manquant dans la réponse: " . json_encode($tokenData));
        header('Location: ' . $frontendUrl . '?auth=error&message=Missing_access_token');
        exit;
    }

    $accessToken = $tokenData['access_token'];
    error_log("✅ Token reçu: " . substr($accessToken, 0, 10) . "...");

    // Stocker le token en cookie HttpOnly
    $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    setcookie('oauth_token', $accessToken, time() + (24 * 60 * 60), '/', $_SERVER['HTTP_HOST'], $isSecure, true);

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
