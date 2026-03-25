import { createBrowserRouter, Navigate } from 'react-router-dom';
import SimpleVibesFeed from './pages/SimpleVibesFeed';
import SimpleCollection from './pages/SimpleCollection';
import SimpleAmenity from './pages/SimpleAmenity';
import { Smart7Collections } from './components/Smart7Collections';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <SimpleVibesFeed />,
  },
  {
    path: "/collection/:collectionSlug",
    element: <SimpleCollection />,
  },
  {
    path: "/amenity/:amenityId",
    element: <SimpleAmenity />,
  },
  {
    path: "/smart7",
    element: <Smart7Collections />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
