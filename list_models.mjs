const GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyDPJqpIRMVYwaHZkVnGcbyRLiuYS8iprSw';
async function list() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GOOGLE_API_KEY}`);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
list();
