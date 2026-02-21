import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AmenityCard from "@/components/AmenityCard";
import { useState } from "react";

// Type
type Amenity = {
  id: string;
  name: string;
  category: string;
  vibe: string;
  imageUrl: string;
  logoUrl?: string;
  rating: number;
  openHours: string;
  terminal: string;
  walkTime: string;
  slug: string;
};

type SortableCardProps = {
  amenity: Amenity;
  id: string;
};

// Draggable AmenityCard
const SortableCard = ({ amenity, id }: SortableCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <AmenityCard {...amenity} isDraggable={true} />
    </div>
  );
};

export default function JourneyReorderView() {
  // Initial state (replace with your actual fetched journey)
  const [items, setItems] = useState<Amenity[]>([
    {
      id: "1",
      name: "Betty's Burgers",
      category: "🍔 Burgers",
      vibe: "Refuel",
      imageUrl:
        "https://bpbyhdjdezynyiclqezy.supabase.co/storage/v1/object/public/amenities/SYD/bettys-burgers.jpg",
      logoUrl:
        "https://bpbyhdjdezynyiclqezy.supabase.co/storage/v1/object/public/amenities/SYD/bettys-burgers-logo.png",
      rating: 4.6,
      openHours: "8:00am – 9:00pm",
      terminal: "T1",
      walkTime: "5 min walk",
      slug: "bettys-burgers",
    },
    {
      id: "2",
      name: "Changi Lounge",
      category: "🛋️ Lounge",
      vibe: "Comfort",
      imageUrl: "/images/changi-lounge.jpg",
      logoUrl: "/images/changi-logo.png",
      rating: 4.8,
      openHours: "24/7",
      terminal: "T3",
      walkTime: "7 min walk",
      slug: "changi-lounge",
    },
    {
      id: "3",
      name: "Coffee & Breakfast",
      category: "☕ Coffee",
      vibe: "Quick",
      imageUrl: "/images/coffee-breakfast.jpg",
      rating: 4.2,
      openHours: "6:00am – 8:00pm",
      terminal: "T1",
      walkTime: "3 min walk",
      slug: "coffee-breakfast",
    },
    {
      id: "4",
      name: "Duty Free Shopping",
      category: "🛍️ Shopping",
      vibe: "Shop",
      imageUrl: "/images/duty-free-shopping.jpg",
      rating: 4.4,
      openHours: "6:00am – 10:00pm",
      terminal: "T1",
      walkTime: "2 min walk",
      slug: "duty-free-shopping",
    },
    {
      id: "5",
      name: "Airline Lounge",
      category: "🛋️ Lounge",
      vibe: "Comfort",
      imageUrl: "/images/airline-lounge.jpg",
      rating: 4.7,
      openHours: "24/7",
      terminal: "T1",
      walkTime: "8 min walk",
      slug: "airline-lounge",
    },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over?.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">🧭 Reorder Your Journey</h2>
      <p className="text-sm text-gray-600 mb-6">
        Drag and drop to reorder your journey stops. The order will be saved automatically.
      </p>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((amenity) => (
              <SortableCard key={amenity.id} id={amenity.id} amenity={amenity} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Journey Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Drag cards to reorder your journey sequence</li>
          <li>• Consider timing and walking distances between stops</li>
          <li>• Mix different vibes for a balanced experience</li>
          <li>• Save your preferred order for future trips</li>
        </ul>
      </div>
    </div>
  );
} 