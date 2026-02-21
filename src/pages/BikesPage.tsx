// Bikes Management Page
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Fab,
  InputAdornment,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  TwoWheeler,
  Inventory,
  AttachMoney,
  Speed,
  Battery90,
  DirectionsBike,
  Close,
  CloudUpload,
  Image as ImageIcon,
} from '@mui/icons-material';
import {
  getAllBikes,
  createBike,
  updateBike,
  deleteBike,
  type CreateBikeData,
} from '../services/firebase/bikes';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase/config';
import type { Bike, BikeCategory, BikeStatus, VehicleCategory } from '../types';

const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: 'luxury-vehicle', label: 'Luxury Vehicle Series' },
  { value: 'national-standard-q', label: 'National Standard Vehicle Q Series' },
  { value: 'electric-motorcycle', label: 'Electric Motorcycle Series' },
  { value: 'special-offer', label: 'Special Offer Series' },
  { value: 'electric-bicycle', label: 'Electric Bicycle Series' },
  { value: 'tianjin-tricycle', label: 'Tianjin Tricycle Model' },
  { value: 'scooter', label: 'Scooter' },
];

const VEHICLE_NAMES: Record<VehicleCategory, string[]> = {
  'luxury-vehicle': [
    'PHANTOM MAX',
    'WAICHAN',
    'EX007 (Lithium Version)',
    'EX007 (Lead-acid Version)',
    'ETERNITY',
  ],
  'national-standard-q': [
    'Quest Q (72V24AH – 1000W Model)',
    'BullKing Q (72V30AH / 72V24AH Dual Battery Model)',
    'Coco Q (60V24AH – 450W Model)',
    'FULING Q',
    'LUNA Q',
    'FORTUNE Q',
    'X-ONE Q',
  ],
  'electric-motorcycle': [
    'SWEET TEA',
    'MILK SHAKE',
    'GRACEFULNESS',
    'CLOUD',
    'LINGYUE',
    'FLORA',
    'Q8',
    'NOV9',
    'FULING',
    'MELODY',
    'NAVIGATOR',
    'TANTOUR',
    'LAND BOUNDARY',
    'VAST UNIVERSE',
    'PATHFINDER',
    'BLITZ',
    'STARRY',
    'ADVENTURE',
    'SPARK',
    'STAR RIVER',
    'Crazy Battle',
    'DAWN',
    'DAWN II',
    'STARSHIP',
    'LIGHTNING',
    'THUNDER',
    'VICTORIA (Lithium Version)',
    'VICTORIA (Lead-acid Version)',
    'X-ONE DT (Lead-acid Version)',
    'X-ONE DT (Lithium Version)',
    'BULL KING',
    'DAWNRAY',
    'X-MAX',
    'COWBOY',
  ],
  'special-offer': [
    'FUMEI',
    'LYFEI II',
  ],
  'electric-bicycle': [
    'GENIUS',
    'YOUMMY',
    'LYFEI',
    'YOLIGHT',
    'YOHA 2.0',
    'YOKUO',
    'NY1',
    'SHADOW',
    'CHEETAH',
    'ICE CREAM',
    'BRONCO PRO',
    'CONFIDANT',
    'WARRIOR',
    'Striker',
    'YOGA Pro',
    'FALCON',
    'HUNTER',
    '137',
    'BULL',
    'M8',
    'EAGLE',
  ],
  'tianjin-tricycle': [
    'QQ II',
    'Q-CANDY',
    'MINI',
    'NIMBUS',
    'TRICLOUD II',
    'Q-STAR II',
    'STARBEAN',
    'STARMAY',
    'STARLORD',
    'STARPULSE II',
    'NEBULA II',
    'STARLORD PRO',
    'T-REX 1.8',
    'Vance 1.6',
    'Drake 1.6',
  ],
  'scooter': [
    'U1',
  ],
};

// Vehicle Specifications Database
interface VehicleSpec {
  brand: string;
  model: string;
  category: BikeCategory;
  motorPower: string;
  batteryCapacity: string;
  range: string;
  maxSpeed: string;
  weight: string;
}

const VEHICLE_SPECIFICATIONS: Record<VehicleCategory, Record<string, VehicleSpec>> = {
  'luxury-vehicle': {
    'PHANTOM MAX': {
      brand: 'LVJU',
      model: 'PHANTOM MAX',
      category: 'electric',
      motorPower: '7000W',
      batteryCapacity: '72V 30AH x2 (LFP Lithium)',
      range: '124 km',
      maxSpeed: '100 km/h',
      weight: '120 KG',
    },
    'WAICHAN': {
      brand: 'LVJU',
      model: 'WAICHAN',
      category: 'electric',
      motorPower: '2500W',
      batteryCapacity: '72V 24AH x2 (LFP Lithium)',
      range: '120 km',
      maxSpeed: '45 km/h',
      weight: '89 KG',
    },
    'EX007 (Lithium Version)': {
      brand: 'LVJU',
      model: 'EX007',
      category: 'electric',
      motorPower: '3500W',
      batteryCapacity: '72V 30AH (LFP Lithium)',
      range: '90 km',
      maxSpeed: '75 km/h',
      weight: '86 KG',
    },
    'EX007 (Lead-acid Version)': {
      brand: 'LVJU',
      model: 'EX007',
      category: 'electric',
      motorPower: '3500W',
      batteryCapacity: '72V 35AH (Lead-Acid)',
      range: '80 km (avg. speed 50 km/h)',
      maxSpeed: '75 km/h',
      weight: '86 KG',
    },
    'ETERNITY': {
      brand: 'LVJU',
      model: 'ETERNITY',
      category: 'electric',
      motorPower: '3500W',
      batteryCapacity: '72V 32AH (Lead-Acid)',
      range: '80 km (avg. speed 50 km/h)',
      maxSpeed: '75 km/h',
      weight: '',
    },
  },
  'national-standard-q': {
    'Quest Q (72V24AH – 1000W Model)': {
      brand: 'LVJU',
      model: 'Quest Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '52 km/h',
      weight: '61.5 KG',
    },
    'BullKing Q (72V30AH / 72V24AH Dual Battery Model)': {
      brand: 'LVJU',
      model: 'BullKing Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 30AH (LFP Lithium) / 72V 24AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '52 km/h',
      weight: '66 KG',
    },
    'Coco Q (60V24AH – 450W Model)': {
      brand: 'LVJU',
      model: 'Coco Q',
      category: 'electric',
      motorPower: '450W',
      batteryCapacity: '60V 24AH (Graphene Lead-Acid)',
      range: '60 km (avg. speed 30 km/h)',
      maxSpeed: '30 km/h',
      weight: '55 KG',
    },
    'FULING Q': {
      brand: 'LVJU',
      model: 'FULING Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 20AH (LFP Lithium) / 72V 24AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '52 km/h',
      weight: '55 KG',
    },
    'LUNA Q': {
      brand: 'LVJU',
      model: 'LUNA Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 30AH (LFP Lithium) / 72V 24AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '50 km/h',
      weight: '74 KG',
    },
    'FORTUNE Q': {
      brand: 'LVJU',
      model: 'FORTUNE Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '50 km/h',
      weight: '61 KG',
    },
    'X-ONE Q': {
      brand: 'LVJU',
      model: 'X-ONE Q',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 30AH (LFP Lithium) / 72V 35AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 50 km/h)',
      maxSpeed: '55 km/h',
      weight: '77 KG',
    },
  },
  'electric-motorcycle': {
    'SWEET TEA': {
      brand: 'LVJU',
      model: 'SWEET TEA',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '48V 20AH (Graphene Lead-Acid)',
      range: '60 km (avg. speed 20 km/h)',
      maxSpeed: '30 km/h',
      weight: '54 KG',
    },
    'MILK SHAKE': {
      brand: 'LVJU',
      model: 'MILK SHAKE',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '72V 20AH (LFP Lithium) / 60V 24AH (Graphene Lead-Acid)',
      range: '70 km (avg. speed 30 km/h)',
      maxSpeed: '35 km/h',
      weight: '54 KG',
    },
    'GRACEFULNESS': {
      brand: 'LVJU',
      model: 'GRACEFULNESS',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60/72V 24AH (Graphene Lead-Acid) / 60V 20AH (LFP Lithium)',
      range: '80 km (avg. speed 30 km/h)',
      maxSpeed: '45 km/h',
      weight: '54 KG',
    },
    'CLOUD': {
      brand: 'LVJU',
      model: 'CLOUD',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60/72V 24AH (Graphene Lead-Acid) / 60V 20AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '45 km/h',
      weight: '56 KG',
    },
    'LINGYUE': {
      brand: 'LVJU',
      model: 'LINGYUE',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 60V 20AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '45 km/h',
      weight: '55 KG',
    },
    'FLORA': {
      brand: 'LVJU',
      model: 'FLORA',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '56 KG',
    },
    'Q8': {
      brand: 'LVJU',
      model: 'Q8',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 60V 20AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '59 KG',
    },
    'NOV9': {
      brand: 'LVJU',
      model: 'NOV9',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72/92V 24AH (Graphene Lead-Acid)',
      range: '100 km',
      maxSpeed: '45 km/h',
      weight: '62 KG',
    },
    'FULING': {
      brand: 'LVJU',
      model: 'FULING',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 72V 20AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '52 km/h',
      weight: '55 KG',
    },
    'MELODY': {
      brand: 'LVJU',
      model: 'MELODY',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 72V 20AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '64 KG',
    },
    'NAVIGATOR': {
      brand: 'LVJU',
      model: 'NAVIGATOR',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72V 35AH (Graphene Lead-Acid)',
      range: '110 km',
      maxSpeed: '50 km/h',
      weight: '62 KG',
    },
    'TANTOUR': {
      brand: 'LVJU',
      model: 'TANTOUR',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 24/35AH (Graphene Lead-Acid) / 72V 30AH (Lithium)',
      range: '90-110 km',
      maxSpeed: '50 km/h',
      weight: '62 KG',
    },
    'LAND BOUNDARY': {
      brand: 'LVJU',
      model: 'LAND BOUNDARY',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 72V 20AH/30AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '62 KG',
    },
    'VAST UNIVERSE': {
      brand: 'LVJU',
      model: 'VAST UNIVERSE',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 35AH (Graphene Lead-Acid) / 72V 30AH (Lithium)',
      range: '100 km',
      maxSpeed: '60 km/h',
      weight: '69 KG',
    },
    'PATHFINDER': {
      brand: 'LVJU',
      model: 'PATHFINDER',
      category: 'electric',
      motorPower: '2500W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid) / 72V 30AH (Lithium)',
      range: '75 km (constant speed 40 km/h)',
      maxSpeed: '50 km/h',
      weight: '77 KG',
    },
    'BLITZ': {
      brand: 'LVJU',
      model: 'BLITZ',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '62 KG',
    },
    'STARRY': {
      brand: 'LVJU',
      model: 'STARRY',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 24AH/35AH (Graphene Lead-Acid)',
      range: '70-110 km',
      maxSpeed: '50 km/h',
      weight: '65 KG',
    },
    'ADVENTURE': {
      brand: 'LVJU',
      model: 'ADVENTURE',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '60/72V 24AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '62 KG',
    },
    'SPARK': {
      brand: 'LVJU',
      model: 'SPARK',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '60/72V 24AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '65 KG',
    },
    'STAR RIVER': {
      brand: 'LVJU',
      model: 'STAR RIVER',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60/72V 20AH (Graphene Lead-Acid) / 70V 20AH / 72V 30AH (LFP Lithium)',
      range: '80-90 km',
      maxSpeed: '50 km/h',
      weight: '65 KG',
    },
    'Crazy Battle': {
      brand: 'LVJU',
      model: 'Crazy Battle',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72V 32AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '63 KG',
    },
    'DAWN': {
      brand: 'LVJU',
      model: 'DAWN',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 32AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '60 KG',
    },
    'DAWN II': {
      brand: 'LVJU',
      model: 'DAWN II',
      category: 'electric',
      motorPower: '2500W',
      batteryCapacity: '72V 30AH/50AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '65 km/h',
      weight: '71 KG',
    },
    'STARSHIP': {
      brand: 'LVJU',
      model: 'STARSHIP',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 32AH (Graphene Lead-Acid)',
      range: '90 km',
      maxSpeed: '50 km/h',
      weight: '68 KG',
    },
    'LIGHTNING': {
      brand: 'LVJU',
      model: 'LIGHTNING',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60/72V 24AH (Graphene Lead-Acid) / 72V 20AH/30AH (LFP Lithium)',
      range: '80-90 km',
      maxSpeed: '50 km/h',
      weight: '67 KG',
    },
    'THUNDER': {
      brand: 'LVJU',
      model: 'THUNDER',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 35AH (Graphene Lead-Acid) / 72V 20AH/30AH (LFP Lithium)',
      range: '100 km',
      maxSpeed: '60 km/h',
      weight: '75 KG',
    },
    'VICTORIA (Lithium Version)': {
      brand: 'LVJU',
      model: 'VICTORIA (Lithium)',
      category: 'electric',
      motorPower: '2500W',
      batteryCapacity: '72V 40AH (LFP Lithium)',
      range: '80 km',
      maxSpeed: '45 km/h',
      weight: '80 KG',
    },
    'VICTORIA (Lead-acid Version)': {
      brand: 'LVJU',
      model: 'VICTORIA (Lead-Acid)',
      category: 'electric',
      motorPower: '1200W',
      batteryCapacity: '72V 24AH (Graphene Lead-Acid)',
      range: '80 km',
      maxSpeed: '50 km/h',
      weight: '80 KG',
    },
    'X-ONE DT (Lead-acid Version)': {
      brand: 'LVJU',
      model: 'X-ONE DT (Lead-Acid)',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 35AH (Graphene Lead-Acid)',
      range: '100 km',
      maxSpeed: '55 km/h',
      weight: '90 KG',
    },
    'X-ONE DT (Lithium Version)': {
      brand: 'LVJU',
      model: 'X-ONE DT (Lithium)',
      category: 'electric',
      motorPower: '3000W-3500W',
      batteryCapacity: '72V 30AH/50AH (LFP Lithium)',
      range: '70 km (avg. speed 45 km/h)',
      maxSpeed: '75-85 km/h',
      weight: '90 KG',
    },
    'BULL KING': {
      brand: 'LVJU',
      model: 'BULL KING DT',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 32AH (Graphene Lead-Acid)',
      range: '90 km (avg. speed 45 km/h)',
      maxSpeed: '60 km/h',
      weight: '77 KG',
    },
    'DAWNRAY': {
      brand: 'LVJU',
      model: 'DAWNRAY',
      category: 'electric',
      motorPower: '1500W',
      batteryCapacity: '72V 30AH/50AH (LFP Lithium)',
      range: '150 km (avg. speed 45 km/h)',
      maxSpeed: '65 km/h',
      weight: '69 KG',
    },
    'X-MAX': {
      brand: 'LVJU',
      model: 'X-MAX (Lead-Acid)',
      category: 'electric',
      motorPower: '2800W',
      batteryCapacity: '72V 32AH (Graphene Lead-Acid)',
      range: '80 km (avg. speed 45 km/h)',
      maxSpeed: '65 km/h',
      weight: '85 KG',
    },
    'COWBOY': {
      brand: 'LVJU',
      model: 'COWBOY',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '72V 20AH (Graphene Lead-Acid)',
      range: '70 km (avg. speed 30 km/h)',
      maxSpeed: '55 km/h',
      weight: '57 KG',
    },
  },
  'special-offer': {
    'FUMEI': {
      brand: 'LVJU',
      model: 'FUMEI',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 12AH (Graphene Lead-Acid)',
      range: '40 km',
      maxSpeed: '32 km/h',
      weight: '27.5 KG',
    },
    'LYFEI II': {
      brand: 'LVJU',
      model: 'LYFEI II',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 20AH (Graphene Lead-Acid)',
      range: '65 km',
      maxSpeed: '32 km/h',
      weight: '34 KG',
    },
  },
  'electric-bicycle': {
    'GENIUS': {
      brand: 'LVJU',
      model: 'GENIUS',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 13Ah (Graphene lead-acid)',
      range: '35–40 km',
      maxSpeed: '30 km/h',
      weight: '30 kg',
    },
    'YOUMMY': {
      brand: 'LVJU',
      model: 'YOUMMY',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48/60V 24Ah (Lead-acid)',
      range: '75 km',
      maxSpeed: '35 km/h',
      weight: '37 kg',
    },
    'LYFEI': {
      brand: 'LVJU',
      model: 'LYFEI',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 24Ah (Graphene lead-acid)',
      range: '60 km',
      maxSpeed: '25 km/h',
      weight: '37 kg',
    },
    'YOLIGHT': {
      brand: 'LVJU',
      model: 'YOLIGHT',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48/60V 24Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '25 km/h',
      weight: '39 kg',
    },
    'YOHA 2.0': {
      brand: 'LVJU',
      model: 'YOHA 2.0',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '35 km/h',
      weight: '39 kg',
    },
    'YOKUO': {
      brand: 'LVJU',
      model: 'YOKUO',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48/60V 24Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '35 km/h',
      weight: '39 kg',
    },
    'NY1': {
      brand: 'LVJU',
      model: 'NY1',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 13Ah (Lead-acid)',
      range: '40 km',
      maxSpeed: '30 km/h',
      weight: '39 kg',
    },
    'SHADOW': {
      brand: 'LVJU',
      model: 'SHADOW',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48/60V 20Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '35 km/h',
      weight: '42.5 kg',
    },
    'CHEETAH': {
      brand: 'LVJU',
      model: 'CHEETAH',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '90 km',
      maxSpeed: '45 km/h',
      weight: '46 kg',
    },
    'ICE CREAM': {
      brand: 'LVJU',
      model: 'ICE CREAM',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 24Ah (Graphene lead-acid)',
      range: '75 km',
      maxSpeed: '35 km/h',
      weight: '40 kg',
    },
    'BRONCO PRO': {
      brand: 'LVJU',
      model: 'BRONCO PRO',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '60/72V 20Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '35 km/h',
      weight: '42.5 kg',
    },
    'CONFIDANT': {
      brand: 'LVJU',
      model: 'CONFIDANT',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '60V 24Ah (Graphene lead-acid)',
      range: '70 km',
      maxSpeed: '25 km/h',
      weight: '43 kg',
    },
    'WARRIOR': {
      brand: 'LVJU',
      model: 'WARRIOR',
      category: 'electric',
      motorPower: '400W',
      batteryCapacity: '60V 32Ah / 72V 20Ah (Lead-acid)',
      range: '80 km',
      maxSpeed: '35 km/h',
      weight: '42.5 kg',
    },
    'Striker': {
      brand: 'LVJU',
      model: 'STRIKER',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60V 32Ah / 72V 20Ah (Lead-acid)',
      range: '100 km',
      maxSpeed: '45 km/h',
      weight: '42.5 kg',
    },
    'YOGA Pro': {
      brand: 'LVJU',
      model: 'YOGA Pro',
      category: 'electric',
      motorPower: '400W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '90 km',
      maxSpeed: '35 km/h',
      weight: '41.5 kg',
    },
    'FALCON': {
      brand: 'LVJU',
      model: 'FALCON',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '90 km',
      maxSpeed: '45 km/h',
      weight: '50 kg',
    },
    'HUNTER': {
      brand: 'LVJU',
      model: 'HUNTER',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '90 km',
      maxSpeed: '45 km/h',
      weight: '55 kg',
    },
    '137': {
      brand: 'LVJU',
      model: '137',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 24Ah (Lead-acid)',
      range: '90 km',
      maxSpeed: '45 km/h',
      weight: '55 kg',
    },
    'BULL': {
      brand: 'LVJU',
      model: 'BULL',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '60V 20Ah (Lead-acid)',
      range: '70 km',
      maxSpeed: '45 km/h',
      weight: '48 kg',
    },
    'M8': {
      brand: 'LVJU',
      model: 'M8',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '46V 18Ah (Lithium-ion) / 72V 20Ah (Lead-acid)',
      range: '40 km',
      maxSpeed: '55 km/h',
      weight: '61 kg',
    },
    'EAGLE': {
      brand: 'LVJU',
      model: 'EAGLE',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 20Ah (Graphene lead-acid)',
      range: '70 km',
      maxSpeed: '40 km/h',
      weight: '55 kg',
    },
  },
  'tianjin-tricycle': {
    'QQ II': {
      brand: 'LVJU',
      model: 'QQ II',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '60/72V 32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '40 km/h',
      weight: '132 kg',
    },
    'Q-CANDY': {
      brand: 'LVJU',
      model: 'Q-CANDY',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '72V/60V 20Ah/32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '32 km/h',
      weight: '75 kg',
    },
    'MINI': {
      brand: 'LVJU',
      model: 'MINI',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '48V 20Ah (Lead-acid)',
      range: '30 km',
      maxSpeed: '20 km/h',
      weight: '45 kg',
    },
    'NIMBUS': {
      brand: 'LVJU',
      model: 'NIMBUS',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '72V/60V 20Ah/32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '35 km/h',
      weight: '114 kg',
    },
    'TRICLOUD II': {
      brand: 'LVJU',
      model: 'TRICLOUD II',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '64/72V 20/32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '35 km/h',
      weight: '145 kg',
    },
    'Q-STAR II': {
      brand: 'LVJU',
      model: 'Q-STAR II',
      category: 'electric',
      motorPower: '500W',
      batteryCapacity: '60/72V 20/32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '40 km/h',
      weight: '140 kg',
    },
    'STARBEAN': {
      brand: 'LVJU',
      model: 'STARBEAN',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '60/72V 20/32Ah (Lead-acid)',
      range: '50 km',
      maxSpeed: '35 km/h',
      weight: '155 kg',
    },
    'STARMAY': {
      brand: 'LVJU',
      model: 'STARMAY',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '60/72V 20/32Ah (Lead-acid)',
      range: '65 km',
      maxSpeed: '35 km/h',
      weight: '155 kg',
    },
    'STARLORD': {
      brand: 'LVJU',
      model: 'STARLORD',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '60/72V 20/45Ah (Lead-acid)',
      range: '65 km',
      maxSpeed: '40 km/h',
      weight: '155 kg',
    },
    'STARPULSE II': {
      brand: 'LVJU',
      model: 'STARPULSE II',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '60/72V 20/32Ah (Lead-acid)',
      range: '65 km',
      maxSpeed: '35 km/h',
      weight: '165 kg',
    },
    'NEBULA II': {
      brand: 'LVJU',
      model: 'NEBULA II',
      category: 'electric',
      motorPower: '800W',
      batteryCapacity: '64/72V 20/32Ah (Lead-acid)',
      range: '65 km',
      maxSpeed: '35 km/h',
      weight: '155 kg',
    },
    'STARLORD PRO': {
      brand: 'LVJU',
      model: 'STARLORD PRO',
      category: 'electric',
      motorPower: '650W',
      batteryCapacity: '60V/72V 20Ah/45Ah (Lead-acid)',
      range: '65 km',
      maxSpeed: '35 km/h',
      weight: '155 kg',
    },
    'T-REX 1.8': {
      brand: 'LVJU',
      model: 'T-REX-1.8',
      category: 'electric',
      motorPower: '1800W',
      batteryCapacity: '60V 45Ah/52Ah/58Ah (Lead-acid)',
      range: '50–70 km',
      maxSpeed: '51 km/h',
      weight: '375 kg',
    },
    'Vance 1.6': {
      brand: 'LVJU',
      model: 'Vance-1.6',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60V 45Ah/52Ah/58Ah (Lead-acid)',
      range: '60–70 km',
      maxSpeed: '35 km/h',
      weight: '159.2 kg',
    },
    'Drake 1.6': {
      brand: 'LVJU',
      model: 'Drake-1.6',
      category: 'electric',
      motorPower: '1000W',
      batteryCapacity: '60V 45Ah/52Ah/58Ah (Lead-acid)',
      range: '60–70 km',
      maxSpeed: '35 km/h',
      weight: '159.2 kg',
    },
  },
  'scooter': {
    'U1': {
      brand: 'LVJU',
      model: 'U1',
      category: 'electric',
      motorPower: '350W',
      batteryCapacity: '36V 10.4Ah (Lithium-ion)',
      range: '25 km',
      maxSpeed: '25 km/h',
      weight: '15 kg',
    },
  },
};

const CATEGORIES: { value: BikeCategory; label: string }[] = [
  { value: 'mountain', label: 'Mountain' },
  { value: 'road', label: 'Road' },
  { value: 'city', label: 'City' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
  { value: 'folding', label: 'Folding' },
];

const STATUS_OPTIONS: { value: BikeStatus; label: string; color: 'success' | 'error' | 'warning' }[] = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'warning' },
];

const initialFormData: CreateBikeData = {
  vehicleCategory: 'luxury-vehicle',
  name: '',
  brand: '',
  model: '',
  category: 'electric',
  price: 0,
  stock: 0,
  description: '',
  specifications: {
    motorPower: '',
    batteryCapacity: '',
    range: '',
    maxSpeed: '',
    weight: '',
  },
  images: [],
  status: 'active',
};

const BikesPage: React.FC = () => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [formData, setFormData] = useState<CreateBikeData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch bikes on mount
  useEffect(() => {
    fetchBikes();
  }, []);

  const fetchBikes = async () => {
    try {
      setLoading(true);
      const data = await getAllBikes();
      setBikes(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bikes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (bike?: Bike) => {
    if (bike) {
      setSelectedBike(bike);
      setFormData({
        vehicleCategory: bike.vehicleCategory,
        name: bike.name,
        brand: bike.brand,
        model: bike.model,
        category: bike.category,
        price: bike.price,
        stock: bike.stock,
        description: bike.description,
        specifications: bike.specifications,
        images: bike.images,
        status: bike.status,
      });
    } else {
      setSelectedBike(null);
      setFormData(initialFormData);
    }
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBike(null);
    setFormData(initialFormData);
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field === 'vehicleCategory') {
      // Reset vehicle name when category changes
      setFormData((prev) => ({ ...prev, [field]: value, name: '' }));
    } else if (field === 'name') {
      // Auto-fill form when vehicle name is selected
      const categorySpecs = VEHICLE_SPECIFICATIONS[formData.vehicleCategory];
      const vehicleSpec = categorySpecs?.[value];
      
      if (vehicleSpec) {
        setFormData((prev) => ({
          ...prev,
          name: value,
          brand: vehicleSpec.brand,
          model: vehicleSpec.model,
          category: vehicleSpec.category,
          specifications: {
            motorPower: vehicleSpec.motorPower,
            batteryCapacity: vehicleSpec.batteryCapacity,
            range: vehicleSpec.range,
            maxSpeed: vehicleSpec.maxSpeed,
            weight: vehicleSpec.weight,
          },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Get available vehicle names for selected category
  const getAvailableVehicleNames = () => {
    return VEHICLE_NAMES[formData.vehicleCategory] || [];
  };

  const handleSpecChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [field]: value },
    }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Image size must be less than 5MB. Please choose a smaller image.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      const timestamp = Date.now();
      const fileName = `bikes/${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      let imageUrls: string[] = formData.images || [];
      
      // Upload image if new file is selected
      if (imageFile) {
        try {
          setUploading(true);
          const imageUrl = await uploadImage(imageFile);
          imageUrls = [imageUrl, ...imageUrls];
        } catch (uploadError) {
          setError('Failed to upload image. Saving without image.');
          console.error('Image upload error:', uploadError);
          // Continue saving without image
        } finally {
          setUploading(false);
        }
      }
      
      const dataToSave: CreateBikeData = {
        vehicleCategory: formData.vehicleCategory,
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        category: formData.category,
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
        description: formData.description || '',
        specifications: {
          motorPower: formData.specifications.motorPower || '',
          batteryCapacity: formData.specifications.batteryCapacity || '',
          range: formData.specifications.range || '',
          maxSpeed: formData.specifications.maxSpeed || '',
          weight: formData.specifications.weight || '',
        },
        images: imageUrls,
        status: formData.status || 'active',
      };
      
      if (selectedBike) {
        await updateBike(selectedBike.id, dataToSave);
      } else {
        await createBike(dataToSave);
      }
      
      // Refresh the bikes list
      await fetchBikes();
      
      // Close dialog and reset
      handleCloseDialog();
      
      // Show success message
      setSuccessMessage(selectedBike ? 'Vehicle updated successfully!' : 'Vehicle added successfully!');
      
      // Clear any previous errors on success
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save bike. Please try again.';
      setError(errorMessage);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDeleteClick = (bike: Bike) => {
    setSelectedBike(bike);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBike) return;
    try {
      setSaving(true);
      await deleteBike(selectedBike.id);
      await fetchBikes();
      setDeleteDialogOpen(false);
      setSelectedBike(null);
    } catch (err) {
      setError('Failed to delete bike');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: BikeStatus) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.color || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Bikes Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your e-bike inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          Add New Bike
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bikes Grid */}
      {bikes.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <TwoWheeler sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bikes found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first bike to the inventory
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add First Bike
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {bikes.map((bike) => (
            <Grid key={bike.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  },
                }}
              >
                {/* Bike Image */}
                {bike.images && bike.images.length > 0 ? (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                    }}
                  >
                    <img
                      src={bike.images[0]}
                      alt={bike.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'background.default',
                      color: 'text.secondary',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                  </Box>
                )}

                {/* Bike Header */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <TwoWheeler sx={{ fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={600} noWrap>
                      {bike.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {bike.brand} • {bike.model}
                    </Typography>
                  </Box>
                </Box>

                <CardContent sx={{ flex: 1, p: 3 }}>
                  {/* Status & Category */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={STATUS_OPTIONS.find((s) => s.value === bike.status)?.label}
                      color={getStatusColor(bike.status)}
                      size="small"
                    />
                    <Chip
                      label={CATEGORIES.find((c) => c.value === bike.category)?.label}
                      variant="outlined"
                      size="small"
                    />
                  </Box>

                  {/* Price & Stock */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ color: 'success.main' }} />
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        ${bike.price.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory sx={{ color: bike.stock > 0 ? 'info.main' : 'error.main' }} />
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color={bike.stock > 0 ? 'info.main' : 'error.main'}
                      >
                        {bike.stock} in stock
                      </Typography>
                    </Box>
                  </Box>

                  {/* Specifications */}
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Specifications
                  </Typography>
                  <Grid container spacing={1}>
                    {bike.specifications.motorPower && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.motorPower}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.batteryCapacity && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Battery90 sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.batteryCapacity}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.range && (
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DirectionsBike sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{bike.specifications.range}</Typography>
                        </Box>
                      </Grid>
                    )}
                    {bike.specifications.maxSpeed && (
                      <Grid size={6}>
                        <Typography variant="body2" color="text.secondary">
                          Max: {bike.specifications.maxSpeed}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  {/* Description */}
                  {bike.description && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {bike.description}
                      </Typography>
                    </>
                  )}
                </CardContent>

                {/* Actions */}
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(bike)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteClick(bike)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600}>
              {selectedBike ? 'Edit Bike' : 'Add New Bike'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                select
                label="Vehicle Category"
                value={formData.vehicleCategory}
                onChange={(e) => handleInputChange('vehicleCategory', e.target.value)}
                required
              >
                {VEHICLE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Vehicle Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              >
                {getAvailableVehicleNames().map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            {/* Vehicle Image Upload */}
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Vehicle Image
              </Typography>
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageChange}
                      disabled={uploading}
                    />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Max 5MB • JPG, PNG, WEBP
                  </Typography>
                </Box>
                
                {imagePreview && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 300,
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                  </Box>
                )}
                
                {!imagePreview && selectedBike?.images && selectedBike.images.length > 0 && (
                  <Box
                    sx={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: 300,
                      border: '2px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={selectedBike.images[0]}
                      alt={selectedBike.name}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Current image
                    </Typography>
                  </Box>
                )}
                
                {!imagePreview && !selectedBike?.images?.length && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      maxWidth: 300,
                      height: 200,
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                      <ImageIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                      <Typography variant="body2">No image selected</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Specifications */}
            <Grid size={12}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                Specifications
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Motor Power"
                value={formData.specifications.motorPower}
                onChange={(e) => handleSpecChange('motorPower', e.target.value)}
                placeholder="e.g., 750W"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Battery Capacity"
                value={formData.specifications.batteryCapacity}
                onChange={(e) => handleSpecChange('batteryCapacity', e.target.value)}
                placeholder="e.g., 48V 14Ah"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Range"
                value={formData.specifications.range}
                onChange={(e) => handleSpecChange('range', e.target.value)}
                placeholder="e.g., 50-60 km"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Max Speed"
                value={formData.specifications.maxSpeed}
                onChange={(e) => handleSpecChange('maxSpeed', e.target.value)}
                placeholder="e.g., 45 km/h"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Weight"
                value={formData.specifications.weight}
                onChange={(e) => handleSpecChange('weight', e.target.value)}
                placeholder="e.g., 25 kg"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving || uploading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || uploading || !formData.name || !formData.brand || !formData.model}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : saving ? (
              <CircularProgress size={24} />
            ) : (
              selectedBike ? 'Update' : 'Create'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Bike</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedBike?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', sm: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BikesPage;
