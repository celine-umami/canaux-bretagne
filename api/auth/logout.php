<?php
/**
 * Endpoint: /api/auth/logout.php
 * Supprime le token OAuth du cookie HttpOnly
 */
header('Content-Type: application/json');

// Supprimer le cookie du token OAuth
setcookie('oauth_token', '', time() - 3600, '/', '', true, true);

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
]);
?>
