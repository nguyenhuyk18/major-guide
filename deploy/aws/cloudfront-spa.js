// CloudFront Function (viewer request) cho React Router:
// đường dẫn không có đuôi file (/expert/123, /my-bookings) -> trả về /index.html.
function handler(event) {
  var request = event.request;
  if (request.uri.indexOf('.') === -1) {
    request.uri = '/index.html';
  }
  return request;
}
