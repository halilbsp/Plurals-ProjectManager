import MediaCard from "./MediaCard";
import ProjectStatsCard from "./ProjectStatsCard";
import BroadcastCard from "./BroadcastCard";

export default function MainGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MediaCard />
      <ProjectStatsCard />
      <BroadcastCard />
    </div>
  );
}