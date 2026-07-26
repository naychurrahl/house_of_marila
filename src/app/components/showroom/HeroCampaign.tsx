import { Link } from 'react-router';

interface HeroCampaignProps {
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

export function HeroCampaign({ title, subtitle, image, link }: HeroCampaignProps) {
  return (
    <Link to={link} className="block relative h-[70vh] overflow-hidden max-w-[1440px] mx-auto">
      <div className="absolute inset-0 bg-neutral-900">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover opacity-90 mix-blend-luminosity"
        />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 px-6">
        <h1 className="text-5xl text-white text-center mb-2 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-white/80 text-center tracking-wide text-sm">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
