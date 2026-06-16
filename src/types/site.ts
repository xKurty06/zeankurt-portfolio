export interface SiteConfig {
    name: string;
    shortName: string;
    title: string;
    headline: string;
    description: string;
    location: string;
    email: string;
    photographyBrand: string;
    studioNomadsBrand: string;
    urls: {
        home: string;
        photography: string;
    };
    tone: string[];
}
