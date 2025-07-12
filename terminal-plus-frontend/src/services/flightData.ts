const API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMWY2YTIzNmQ3ZjdjYTliNzY2ZDI5Yjc3N2IzNDZiMWU0NWEyNDdjZjY2MTllYzMwYzlmNjQ0MjM3MmM5NzBjMzVlZDQwNmFhYTE1ZmJhODEiLCJpYXQiOjE3NDQ3Mjk1NzksIm5iZiI6MTc0NDcyOTU3OSwiZXhwIjoxNzc2MjY1NTc5LCJzdWIiOiIyNDY5OSIsInNjb3BlcyI6W119.DAoiBcnUZEvdfh8_lLfGxgICoDCJr0YhiDAUBDqVgk4DlkPRuqzr3fcVfu_98OhUYmVSXJfzgKt0Pdnud7Q9uQ";

type FetchFlightInfoParams = {
  flightNumber?: string;
  dep?: string;
  arr?: string;
  date?: string;
};

export async function fetchFlightInfo({ flightNumber, dep, arr, date }: FetchFlightInfoParams) {
  let url = `https://www.goflightlabs.com/flights?access_key=${API_KEY}`;
  if (flightNumber) url += `&flight_iata=${flightNumber}`;
  else if (dep && arr && date) url += `&dep_iata=${dep}&arr_iata=${arr}&flight_date=${date}`;
  else throw new Error("Insufficient flight info");
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch flight data");
  return res.json();
} 