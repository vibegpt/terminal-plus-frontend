import { createBrowserRouter, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import AmenityDetailPage from './pages/AmenityDetailPage';
import { Smart7Collections } from './components/Smart7Collections';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/collection/:collectionSlug",
    element: <CollectionDetailPage />,
  },
  {
    path: "/amenity/:amenityId",
    element: <AmenityDetailPage />,
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
