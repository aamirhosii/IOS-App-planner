"use server"

/**
 * Gets place details from Google Maps API using a place ID
 */
export async function getPlaceDetails(placeId: string) {
  try {
    // Use the server-only environment variable (without NEXT_PUBLIC_ prefix)
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      throw new Error("Google Maps API key is not configured")
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components&key=${apiKey}`,
      { cache: "no-store" },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch place details")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching place details:", error)
    throw new Error("Failed to fetch place details from Google Maps API")
  }
}
