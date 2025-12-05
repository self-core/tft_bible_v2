# CORS Configuration for TFT Bible API Gateway

This document explains how to properly implement CORS for the API Gateway to prevent the "Cross-Origin Request Blocked" error encountered by frontend applications.

## Current Issue
The current implementation does not include CORS headers, which causes browsers to block requests from frontend applications running on different origins (e.g., localhost:3000 accessing localhost:8080).

## Recommended Solution

To add CORS support to the Axum-based API Gateway, use the following implementation pattern:

```rust
use axum::{
    routing::get,
    Router,
};
use tower_http::cors::{CorsLayer, AllowOrigin};
use tower::ServiceBuilder;

// In your main function, before binding the server:
let cors_layer = CorsLayer::new()
    .allow_origin(AllowOrigin::any())
    .allow_methods(tower_http::cors::Any)
    .allow_headers(tower_http::cors::Any);

let app = app.layer(cors_layer);

// Then run your server as usual:
let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
axum::serve(listener, app).await.unwrap();
```

## Alternative Solution: Per-Route CORS Configuration

If global CORS causes issues, you can implement CORS at the route level using middleware:

```rust
use axum::{
    http::Method,
    middleware::{self, Next},
    response::Response,
    RequestExt,
};
use hyper::Request;

async fn cors_middleware<B>(mut req: Request<B>, next: Next<B>) -> Result<Response, hyper::Error> {
    let mut response = next.run(req).await;
    
    // Add CORS headers
    response.headers_mut().insert(
        hyper::header::ACCESS_CONTROL_ALLOW_ORIGIN,
        hyper::header::HeaderValue::from_static("*"),
    );
    response.headers_mut().insert(
        hyper::header::ACCESS_CONTROL_ALLOW_METHODS,
        hyper::header::HeaderValue::from_static("GET, POST, PUT, DELETE, OPTIONS"),
    );
    response.headers_mut().insert(
        hyper::header::ACCESS_CONTROL_ALLOW_HEADERS,
        hyper::header::HeaderValue::from_static("*"),
    );
    
    Ok(response)
}
```

## Version Compatibility Note

This project uses Axum 0.7.9 and tower-http 0.4.4, which may have compatibility issues with certain CORS configuration patterns. If you encounter trait bound errors like:

```
the trait bound `Cors<Route>: Service<axum::http::Request<axum::body::Body>>` is not satisfied
```

Try one of the following:
1. Use the ServiceBuilder approach mentioned above
2. Apply CORS as a layer before adding state to the router
3. Consider upgrading to newer compatible versions

## Docker Integration

When CORS is correctly implemented, the frontend application running in Docker should be able to successfully communicate with the API Gateway at `http://localhost:8080` without encountering CORS errors.