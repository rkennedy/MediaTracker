import { MediaItemForProvider, MediaType } from 'src/entity/mediaItem';
import { Audible } from 'src/metadata/metadataProvider/audible';
import { IGDB } from 'src/metadata/metadataProvider/igdb';
import { OpenLibrary } from 'src/metadata/metadataProvider/openlibrary';
import { TMDbMovie, TMDbTv } from 'src/metadata/metadataProvider/tmdb';
import _ from 'lodash';

const providers = <const>[
    new IGDB(),
    new Audible(),
    new OpenLibrary(),
    new TMDbMovie(),
    new TMDbTv(),
];

class MetadataProviders {
    private readonly metadataProviders = new Map(
        _(providers)
            .groupBy((provider) => provider.mediaType)
            .mapValues(
                (value) =>
                    new Map(_.entries(_.keyBy(value, (value) => value.name)))
            )
            .entries()
            .value()
    );

    public load = async (): Promise<void> => {
        await Promise.all(
            providers.map((provider) => provider.loadCredentails())
        );
    };

    public loadCredentails = async (providerName: string): Promise<void> => {
        await Promise.all(
            providers
                .filter((provider) => provider.name === providerName)
                .map((provider) => provider.loadCredentails())
        );
    };

    public has(mediaType: MediaType): boolean {
        return this.metadataProviders.has(mediaType);
    }

    public get(mediaType: MediaType, name?: string) {
        return name
            ? this.metadataProviders.get(mediaType)?.get(name)
            : this.metadataProviders.get(mediaType)?.values().next().value;
    }

    public details(
        mediaItem: MediaItemForProvider
    ): Promise<MediaItemForProvider> | null {
        return this.get(mediaItem.mediaType, mediaItem.source)?.details(
            mediaItem
        );
    }
}

export const metadataProviders = new MetadataProviders();

type ToMetadataProviderCredentialsType<
    Input extends ReadonlyArray<unknown>,
    Result extends ReadonlyArray<unknown> = []
> = Input extends readonly []
    ? Result
    : Input extends readonly [infer First, ...infer Rest]
    ? MapType<First> extends never
        ? ToMetadataProviderCredentialsType<Rest, Result>
        : ToMetadataProviderCredentialsType<Rest, [...Result, MapType<First>]>
    : Result;

type MetadataProviderCredentialsType = ToMetadataProviderCredentialsType<
    typeof providers
>;

type MapType<T> = T extends {
    name: infer Name;
    credentialNames: infer CredentialNames;
}
    ? Name extends string
        ? CredentialNames extends readonly []
            ? never
            : CredentialNames extends ReadonlyArray<string>
            ? {
                  name: Name;
                  credentials: Record<CredentialNames[number], string>;
              }
            : never
        : never
    : never;

export type MetadataProvidersCredentialsResponseType = {
    [K in Property<MetadataProviderCredentialsRequestType, 'name'>]: Property<
        Extract<MetadataProviderCredentialsRequestType, { name: K }>,
        'credentials'
    >;
};

export type MetadataProviderCredentialsRequestType = Extract<
    MetadataProviderCredentialsType[number],
    { name: string; credentials: unknown }
>;

type Property<
    T extends Record<string, unknown>,
    Name extends keyof T
> = T extends { [Key in Name]: infer P } ? P : never;
