import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const featureIcons: Record<string, string> = {
  "Wi-Fi": "📶",
  "Family Friendly": "😊",
  "Power Outlets": "🔌",
  "Credit Cards": "💳",
  "Mobile Ordering": "📱",
  "Outdoor Seating": "🌳",
  "Wheelchair Accessible": "♿",
  "Pet Friendly": "🐕",
  "Quiet Zone": "🤫",
  "Business Center": "💼",
  "Shower Facilities": "🚿",
  "Prayer Room": "🙏",
  "Currency Exchange": "💱",
  "Baggage Storage": "🧳",
  "Information Desk": "ℹ️",
  "Medical Services": "🏥",
  "Security Check": "🔒",
  "Immigration": "🛂",
  "Customs": "📋",
  "Tax Refund": "💰",
};

type Props = {
  name: string;
  imageUrls: string[];
  vibe: string;
  rating: number;
  reviews: number;
  category: string;
  openHours: string;
  features: string[];
  locationMapUrl?: string;
  similar?: { name: string; distance: string; price: string }[];
};

const vibeColors: Record<string, { bg: string; text: string; glow: string }> = {
  Refuel: { bg: "bg-orange-500", text: "text-white", glow: "shadow-orange-500/50" },
  Comfort: { bg: "bg-blue-500", text: "text-white", glow: "shadow-blue-500/50" },
  Quick: { bg: "bg-yellow-500", text: "text-yellow-900", glow: "shadow-yellow-500/50" },
  Explore: { bg: "bg-purple-500", text: "text-white", glow: "shadow-purple-500/50" },
  Work: { bg: "bg-green-500", text: "text-white", glow: "shadow-green-500/50" },
  Shop: { bg: "bg-pink-500", text: "text-white", glow: "shadow-pink-500/50" },
  Chill: { bg: "bg-teal-500", text: "text-white", glow: "shadow-teal-500/50" },
  refuel: { bg: "bg-orange-500", text: "text-white", glow: "shadow-orange-500/50" },
  comfort: { bg: "bg-blue-500", text: "text-white", glow: "shadow-blue-500/50" },
  quick: { bg: "bg-yellow-500", text: "text-yellow-900", glow: "shadow-yellow-500/50" },
  explore: { bg: "bg-purple-500", text: "text-white", glow: "shadow-purple-500/50" },
  work: { bg: "bg-green-500", text: "text-white", glow: "shadow-green-500/50" },
  shop: { bg: "bg-pink-500", text: "text-white", glow: "shadow-pink-500/50" },
  chill: { bg: "bg-teal-500", text: "text-white", glow: "shadow-teal-500/50" },
};

const AmenityDetailPage: React.FC<Props> = ({
  name,
  imageUrls,
  vibe,
  rating,
  reviews,
  category,
  openHours,
  features,
  locationMapUrl,
  similar = [],
}) => {
  const colors = vibeColors[vibe] || vibeColors.Refuel;

  return (
    <div className={`max-w-xl mx-auto p-4 bg-white rounded-3xl shadow-md`}>
      <div className="relative overflow-hidden rounded-3xl">
        <Swiper spaceBetween={10} slidesPerView={1} className="rounded-3xl">
          {imageUrls.map((url, index) => (
            <SwiperSlide key={index}>
              <img
                src={url}
                alt={`${name} ${index + 1}`}
                className="w-full h-48 object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className={`absolute top-3 right-3 px-3 py-1 text-sm font-medium rounded-full ${colors.bg} ${colors.text} shadow-lg ${colors.glow}`}>
          {vibe}
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        <div className="flex items-center gap-1 mt-1">
          {"⭐".repeat(Math.floor(rating))}
          <span className="text-gray-600 text-sm ml-1">
            {rating.toFixed(1)} ({reviews} reviews)
          </span>
        </div>

        <span className="inline-block mt-2 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          📍 {category}
        </span>

        <div className="mt-6">
          <h2 className="font-semibold text-lg">Opening Hours</h2>
          <p className="text-gray-700">{openHours}</p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-lg mb-2">Features</h2>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <span
                key={feature}
                className="bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-full flex items-center gap-1"
              >
                {featureIcons[feature] || "•"} {feature}
              </span>
            ))}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">Similar Places</h2>
            <ul className="text-sm text-gray-700">
              {similar.map((place) => (
                <li key={place.name} className="mb-1">
                  {place.name} · {place.distance} · {place.price}
                </li>
              ))}
            </ul>
          </div>
        )}

        {locationMapUrl && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2">📍 Find It Fast</h2>
            <iframe
              src={locationMapUrl}
              width="100%"
              height="200"
              className="rounded-xl border border-gray-200"
              allowFullScreen
              loading="lazy"
              title={`Map location for ${name}`}
            ></iframe>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200 font-medium">
            Get Directions
          </button>
          <button className="flex-1 border border-gray-300 text-gray-800 py-2 rounded-xl text-sm hover:scale-[1.02] hover:shadow-md transition-all duration-200 font-medium">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AmenityDetailPage; 