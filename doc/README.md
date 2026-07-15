# API docs

`openapi.yaml` is an OpenAPI 3.0 spec for the backend, covering every route in `Controller.php`.

## Viewing it

Easiest: paste the contents into [editor.swagger.io](https://editor.swagger.io).

Locally, with the frontend's dependencies already installed:

```
cd ../../frontend
npx --package swagger-ui-dist -- true 2>/dev/null; npx @redocly/cli preview-docs ../backend/doc/openapi.yaml
```

or any other Swagger/OpenAPI viewer of your choice.

## Known gap

`POST/PUT/DELETE /trend` are routed in `Controller.php` but `Functions.php` has no
`addTrend`/`updateTrend`/`deleteTrend` - calling them currently errors out server-side
instead of returning JSON. Left out of `openapi.yaml`'s documented contract on purpose;
fix the backend (implement them, or make them return the same "not writable" response
`/stats`'s write methods use) before documenting a shape for them.
