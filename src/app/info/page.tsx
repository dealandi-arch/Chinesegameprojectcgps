import { getAllSlides } from "@/lib/slides";
import { SlideShow } from "@/components/slides/SlideShow";
import { ThemedPage } from "@/components/theme/ThemedPage";

export default async function InfoPage() {
  const slides = await getAllSlides();

  return (
    <ThemedPage className="flex-1 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-bold">Info</h1>
        <p className="mt-1 text-sm opacity-70">
          Background, guides, and updates from the Wok Quest team.
        </p>
        <div className="mt-8">
          <SlideShow slides={slides} />
        </div>
      </div>
    </ThemedPage>
  );
}
