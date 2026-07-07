<?php
/**
 * Endpoint: /api/auth/logout.php
 * Supprime le token OAuth du cookie HttpOnly
 */
header('Content-Type: application/json');

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

// Supprimer le cookie avec les mêmes paramètres que lors de la création
$isSecure = !empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https' ||
            (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on');
$cookieDomain = !empty($_SERVER['HTTP_X_FORWARDED_HOST']) ? $_SERVER['HTTP_X_FORWARDED_HOST'] : $_SERVER['HTTP_HOST'];

// Supprimer le cookie en le vidant et en le datant dans le passé
setcookie('oauth_token', '', time() - 3600, '/', $cookieDomain, $isSecure, true);

error_log("🚪 Logout: Cookie supprimé (domain: {$cookieDomain}, secure: {$isSecure})");

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
]);
?>
