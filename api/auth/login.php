<?php
/**
 * Fichier: api/auth/login.php
 * Redirige l'utilisateur vers Huwise pour authentification
 */

// Configuration OAuth
$clientId = '0a0c7a402e4f4b169d1e32a3c1046320';
$authUrl = 'https://data.bretagne.bzh/oauth2/authorize';
$redirectUri = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://{$_SERVER['HTTP_HOST']}/api/auth/callback.php";

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

// Log pour debug
error_log("🔐 Redirection vers Huwise: {$huWiseAuthUrl}");

// Rediriger vers Huwise
header('Location: ' . $huWiseAuthUrl);
exit;
?>
