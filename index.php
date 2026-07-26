<?php

$allowedOrigins = include dirname(__DIR__) . '/config/cors.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$isLocalDev = (bool) preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin);

if ($isLocalDev || in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: $origin");
}

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: X-HTTP-Method-Override, Content-Type, Authorization");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204); // No content
  exit();
}

require_once __DIR__ . '/Controller.php';


// Get method and URI

$method = strtoupper(
  $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? $_SERVER['REQUEST_METHOD']
);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$uri = trim($uri, '/');


// Break URI parts

$parts = explode('/', $uri);


// Pass to router/controller

$controller = new Controller($parts, $method);