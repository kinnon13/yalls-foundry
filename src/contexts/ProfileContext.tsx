import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Profile Context - Tracks which entity (business/farm/horse/user) is currently active
 * This allows backend apps (CRM, Analytics, Earnings) to filter data by entity
 */

export type EntityType = 'user' | 'business' | 'farm' | 'horse' | 'event';

export interface ActiveProfile {
  id: string;
  type: EntityType;
  name: string;
  avatarUrl?: string;
}

interface ProfileContextValue {
  activeProfile: ActiveProfile | null;
  setActiveProfile: (profile: ActiveProfile | null) => void;
  userProfiles: ActiveProfile[]; // All profiles user owns
  setUserProfiles: (profiles: ActiveProfile[]) => void;
  comparisonMode: boolean;
  setComparisonMode: (enabled: boolean) => void;
  comparisonProfiles: ActiveProfile[];
  setComparisonProfiles: (profiles: ActiveProfile[]) => void;
  toggleComparisonProfile: (profile: ActiveProfile) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [userProfiles, setUserProfiles] = useState<ActiveProfile[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonProfiles, setComparisonProfiles] = useState<ActiveProfile[]>([]);

  const toggleComparisonProfile = (profile: ActiveProfile) => {
    setComparisonProfiles((prev) => {
      const exists = prev.find((p) => p.id === profile.id);
      if (exists) {
        return prev.filter((p) => p.id !== profile.id);
      }
      return [...prev, profile];
    });
  };

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        userProfiles,
        setUserProfiles,
        comparisonMode,
        setComparisonMode,
        comparisonProfiles,
        setComparisonProfiles,
        toggleComparisonProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
}
