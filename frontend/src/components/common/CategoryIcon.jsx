import React from 'react';
import {
  Hammer,
  Sprout,
  Tent,
  Utensils,
  Paintbrush,
  Activity,
  Tv,
  Gamepad2,
  Sparkles,
  Truck,
  Music,
  Layers,
  Wrench,
  Package,
} from 'lucide-react';

const iconMap = {
  Hammer,
  Sprout,
  Tent,
  Utensils,
  Paintbrush,
  Activity,
  Tv,
  Gamepad2,
  Sparkles,
  Truck,
  Music,
  Layers,
  Wrench,
  Package,
};

const CategoryIcon = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = iconMap[name] || Layers;
  return <IconComponent className={className} />;
};

export default CategoryIcon;
