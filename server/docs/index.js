import SwaggerUI from 'swagger-ui';
import 'swagger-ui/dist/swagger-ui.css';

const spec = require('./../openapi.json');

const ui = SwaggerUI({
    spec: spec,
    dom_id: '#swagger',
});
