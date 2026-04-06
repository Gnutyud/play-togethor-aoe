import { useStore } from "../store/useStore";
import RoomListView from "./RoomListView";
import InRoomView from "./InRoomView";

export default function MainScreen() {
  const { currentRoom } = useStore();

  // If user is in a room, show in-room view
  if (currentRoom) {
    return <InRoomView />;
  }

  // Otherwise show room list
  return <RoomListView />;
}
