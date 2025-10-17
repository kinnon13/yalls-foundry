import { profilePinsMock } from '@/adapters/mock/profilePins.mock';
import { profilePinsDb } from '@/adapters/db/profilePins.db';
import { favoritesMock } from '@/adapters/mock/favorites.mock';
import { favoritesDb } from '@/adapters/db/favorites.db';
import { repostsMock } from '@/adapters/mock/reposts.mock';
import { repostsDb } from '@/adapters/db/reposts.db';
import { linkedAccountsMock } from '@/adapters/mock/linkedAccounts.mock';
import { linkedAccountsDb } from '@/adapters/db/linkedAccounts.db';
import { entityEdgesMock } from '@/adapters/mock/entityEdges.mock';
import { entityEdgesDb } from '@/adapters/db/entityEdges.db';

const USE_DB = import.meta.env.PROD && !import.meta.env.VITE_FORCE_MOCK;

export const ProfilePins = USE_DB ? profilePinsDb : profilePinsMock;
export const Favorites = USE_DB ? favoritesDb : favoritesMock;
export const Reposts = USE_DB ? repostsDb : repostsMock;
export const LinkedAccounts = USE_DB ? linkedAccountsDb : linkedAccountsMock;
export const EntityEdges = USE_DB ? entityEdgesDb : entityEdgesMock;

export * from './profilePins';
export * from './favorites';
export * from './reposts';
export * from './linkedAccounts';
export * from './entityEdges';
