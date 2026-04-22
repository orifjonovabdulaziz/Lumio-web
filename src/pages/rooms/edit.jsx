import React from 'react';
import { RoomForm } from './form.jsx';

export function RoomEditPage({ name }) {
  return <RoomForm mode="edit" roomName={name} />;
}
