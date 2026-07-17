import Link from "next/link";

// Store logo (from settings) with text fallback — used in every customer header
export default function LogoMark({ logo, name }: { logo: string | null; name: string }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-10 w-auto object-contain" />
      ) : (
        <span className="text-2xl font-bold text-orange-500">
          {name.split(" ")[0]} <span className="text-gray-900">{name.split(" ").slice(1).join(" ")}</span>
        </span>
      )}
    </Link>
  );
}
