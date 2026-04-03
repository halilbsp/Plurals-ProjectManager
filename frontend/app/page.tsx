import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MainGrid from "@/components/dashboard/MainGrid";
import BottomSection from "@/components/dashboard/BottomSection";

export default function Home() {
  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-2 pb-10">
      <DashboardHeader />
      <MainGrid />
      <BottomSection />
    </div>
  );
}