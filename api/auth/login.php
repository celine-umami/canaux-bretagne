<?php
/**
 * Fichier: api/auth/login.php
 * Redirige l'utilisateur vers Huwise pour authentification
 */

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
$clientId = 'af6a8171ae5f4373bb7f1c00546543e9';
$authUrl = 'https://data.bretagne.bzh/oauth2/authorize';
$redirectUri = 'https://canaux-bretagne.umamidata.com/api/auth/callback';

// Générer un state aléatoire pour la sécurité CSRF
$state = bin2hex(random_bytes(16));

// Stocker le state en session
session_start();
$_SESSION['oauth_state'] = $state;

// Construire l'URL de redirection vers Huwise
$huWiseAuthUrl = $authUrl . '?' . http_build_query([
    'client_id' => $clientId,
    'redirect_uri' => $redirectUri,
    'response_type' => 'code',
    'state' => $state
]);

error_log("🔐 OAuth: Redirection vers Huwise");

// Rediriger vers Huwise
header('Location: ' . $huWiseAuthUrl);
exit;
?>
