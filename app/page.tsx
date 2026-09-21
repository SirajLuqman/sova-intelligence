import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About, { type AboutData } from "@/components/About";
import Expertise, { type ExpertiseData } from "@/components/Expertise";
import Services, { type ServicesData } from "@/components/Services";
import Projects, { type ProjectData } from "@/components/Projects";
import Methodology, { type MethodologyData } from "@/components/Methodology";
import Team, { type TeamMember } from "@/components/Team";
import Footer, { type FooterData } from "@/components/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    aboutData,
    expertiseData,
    servicesData,
    projectsSettingsData,
    projectsData,
    methodologyData,
    teamData,
    footerData,
  ] = await Promise.all([
    prisma.aboutSettings.findUnique({
      where: { id: 1 },
    }),

    prisma.expertiseSettings.findUnique({
      where: { id: 1 },
    }),

    prisma.servicesSettings.findUnique({
      where: { id: 1 },
    }),

    prisma.projectsSettings.findUnique({
      where: { id: "projects" },
      select: {
        sectionTitle: true,
      },
    }),

    prisma.project.findMany({
      where: {
        projectsSettingsId: "projects",
      },
      orderBy: {
        displayOrder: "asc",
      },
      select: {
        id: true,
        badge: true,
        title: true,
        description: true,
        icon: true,
        targetPartners: true,
        focusDomain: true,
        deliverables: true,
        images: {
          orderBy: {
            displayOrder: "asc",
          },
          select: {
            imageData: true,
            displayOrder: true,
          },
        },
      },
    }),

    prisma.methodologySettings.findUnique({
      where: { id: 1 },
    }),

    prisma.teamSettings.findUnique({
  where: { id: 1 },
}),

    prisma.footerSettings.findUnique({
      where: { id: 1 },
    }),
  ]);

  const mappedProjects: ProjectData[] = projectsData.map((project) => ({
    id: project.id,
    badge: project.badge,
    title: project.title,
    description: project.description,
    icon: project.icon || "globe",
    images: project.images
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((image) => image.imageData),
    targetPartners: project.targetPartners,
    focusDomain: project.focusDomain,
    deliverables: Array.isArray(project.deliverables)
      ? project.deliverables.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <Hero />

      <About data={aboutData as AboutData | null} />

      <Expertise data={expertiseData as ExpertiseData | null} />

      <Services data={servicesData as ServicesData | null} />

      <Projects
        data={mappedProjects}
        sectionTitle={projectsSettingsData?.sectionTitle || "Our Projects"}
      />

      <Methodology data={methodologyData as MethodologyData | null} />

      <Team
  data={
    teamData
      ? {
          sectionTitle: teamData.sectionTitle,
          members: Array.isArray(teamData.members)
            ? (teamData.members as unknown as TeamMember[])
            : [],
        }
      : null
  }
/>

      <Footer data={footerData as FooterData | null} />
    </div>
  );
}
