/**
 * Create Sheet
 * 7 options: Profile, Business, Horse, Farm, Post, Listing, Event
 */

import { useState } from 'react';
import { User, Building, Gem, Tractor, FileText, Package, Calendar } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { rocker } from '@/lib/rocker/event-bus';

interface CreateOption {
  key: string;
  label: string;
  icon: any;
  description: string;
  route: string;
}

const CREATE_OPTIONS: CreateOption[] = [
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Create a new user profile',
    route: '/profile/new',
  },
  {
    key: 'business',
    label: 'Business',
    icon: Building,
    description: 'Register a business entity',
    route: '/entities?type=business&action=create',
  },
  {
    key: 'horse',
    label: 'Horse',
    icon: Gem,
    description: 'Add a horse to the registry',
    route: '/entities?type=horse&action=create',
  },
  {
    key: 'farm',
    label: 'Farm',
    icon: Tractor,
    description: 'Register a farm location',
    route: '/entities?type=farm&action=create',
  },
  {
    key: 'post',
    label: 'Post',
    icon: FileText,
    description: 'Share a post with the community',
    route: '/?action=create-post',
  },
  {
    key: 'listing',
    label: 'Listing',
    icon: Package,
    description: 'Create a marketplace listing',
    route: '/listings/new',
  },
  {
    key: 'event',
    label: 'Event',
    icon: Calendar,
    description: 'Schedule an event',
    route: '/events/new',
  },
];

export function CreateSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();

  const handleSelect = (option: CreateOption) => {
    rocker.emit('create_action', { metadata: { type: option.key } });
    navigate(option.route);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Create</SheetTitle>
          <SheetDescription>What would you like to create?</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {CREATE_OPTIONS.map((option) => (
            <Button
              key={option.key}
              variant="outline"
              className="h-24 flex flex-col items-start justify-start gap-2 p-4"
              onClick={() => handleSelect(option)}
            >
              <option.icon className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
