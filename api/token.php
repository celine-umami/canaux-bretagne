<?php
/**
 * Endpoint: /api/token.php
 * Retourne le token OAuth depuis le cookie HttpOnly
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$token = $_COOKIE['oauth_token'] ?? null;

echo json_encode([
    'access_token' => $token,
    'authenticated' => !is_null($token)
]);
?>
