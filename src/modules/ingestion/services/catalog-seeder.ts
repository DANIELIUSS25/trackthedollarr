import { Prisma } from "@prisma/client";

import { prisma } from "../../../core/db/prisma";
import {
  dataSources,
  derivedMetricDefinitions,
  methodologyNotes
} from "../../sources/definitions/catalog";

export class CatalogSeeder {
  async seed(): Promise<void> {
    for (const note of methodologyNotes) {
      await prisma.methodologyNote.upsert({
        where: { slug: note.slug },
        update: {
          title: note.title,
          summary: note.summary,
          contentMarkdown: note.contentMarkdown,
          disclosure: note.disclosure,
          limitations: note.limitations,
          tags: note.tags
        },
        create: {
          slug: note.slug,
          title: note.title,
          summary: note.summary,
          contentMarkdown: note.contentMarkdown,
          disclosure: note.disclosure,
          limitations: note.limitations,
          tags: note.tags
        }
      });
    }

    const methodologyBySlug = new Map(
      (
        await prisma.methodologyNote.findMany({
          select: {
            id: true,
            slug: true
          }
        })
      ).map((note) => [note.slug, note.id])
    );

    for (const source of dataSources) {
      const dataSource = await prisma.dataSource.upsert({
        where: { slug: source.slug },
        update: {
          name: source.name,
          kind: source.kind,
          baseUrl: source.baseUrl,
          authType: source.authType,
          timeoutMs: source.timeoutMs,
          rateLimitPerMinute: source.rateLimitPerMinute,
          updateFrequency: source.updateFrequency,
          expectedLatencyHours: source.expectedLatencyHours,
          staleAfterHours: source.staleAfterHours,
          tags: source.tags,
          metadata: (source.metadata ?? {}) as Prisma.JsonObject
        },
        create: {
          slug: source.slug,
          name: source.name,
          kind: source.kind,
          baseUrl: source.baseUrl,
          authType: source.authType,
          timeoutMs: source.timeoutMs,
          rateLimitPerMinute: source.rateLimitPerMinute,
          updateFrequency: source.updateFrequency,
          expectedLatencyHours: source.expectedLatencyHours,
          staleAfterHours: source.staleAfterHours,
          tags: source.tags,
          metadata: (source.metadata ?? {}) as Prisma.JsonObject
        }
      });

      for (const dataset of source.datasets) {
        const createdDataset = await prisma.dataset.upsert({
          where: {
            dataSourceId_slug: {
              dataSourceId: dataSource.id,
              slug: dataset.slug
            }
          },
          update: {
            name: dataset.name,
            description: dataset.description,
            category: dataset.category,
            apiPath: dataset.apiPath,
            sourcePageUrl: dataset.sourcePageUrl,
            updateFrequency: dataset.updateFrequency,
            valueType: dataset.valueType,
            staleAfterHours: dataset.staleAfterHours,
            expectedLatencyHours: dataset.expectedLatencyHours,
            tags: dataset.tags,
            metadata: (dataset.metadata ?? {}) as Prisma.JsonObject,
            methodologyNoteId: dataset.methodologyNoteSlug
              ? methodologyBySlug.get(dataset.methodologyNoteSlug) ?? null
              : null
          },
          create: {
            dataSourceId: dataSource.id,
            slug: dataset.slug,
            name: dataset.name,
            description: dataset.description,
            category: dataset.category,
            apiPath: dataset.apiPath,
            sourcePageUrl: dataset.sourcePageUrl,
            updateFrequency: dataset.updateFrequency,
            valueType: dataset.valueType,
            staleAfterHours: dataset.staleAfterHours,
            expectedLatencyHours: dataset.expectedLatencyHours,
            tags: dataset.tags,
            metadata: (dataset.metadata ?? {}) as Prisma.JsonObject,
            methodologyNoteId: dataset.methodologyNoteSlug
              ? methodologyBySlug.get(dataset.methodologyNoteSlug) ?? null
              : null
          }
        });

        for (const series of dataset.series) {
          await prisma.series.upsert({
            where: { slug: series.slug },
            update: {
              datasetId: createdDataset.id,
              sourceCode: series.sourceCode,
              name: series.name,
              description: series.description,
              unit: series.unit,
              frequency: series.frequency,
              category: series.category,
              valueType: series.valueType,
              sourcePageUrl: series.sourcePageUrl,
              tags: series.tags,
              staleAfterHours: series.staleAfterHours,
              metadata: (series.metadata ?? {}) as Prisma.JsonObject,
              methodologyNoteId: series.methodologyNoteSlug
                ? methodologyBySlug.get(series.methodologyNoteSlug) ?? null
                : null
            },
            create: {
              datasetId: createdDataset.id,
              slug: series.slug,
              sourceCode: series.sourceCode,
              name: series.name,
              description: series.description,
              unit: series.unit,
              frequency: series.frequency,
              category: series.category,
              valueType: series.valueType,
              sourcePageUrl: series.sourcePageUrl,
              tags: series.tags,
              staleAfterHours: series.staleAfterHours,
              metadata: (series.metadata ?? {}) as Prisma.JsonObject,
              methodologyNoteId: series.methodologyNoteSlug
                ? methodologyBySlug.get(series.methodologyNoteSlug) ?? null
                : null
            }
          });
        }
      }
    }

    for (const metric of derivedMetricDefinitions) {
      await prisma.derivedMetricDefinition.upsert({
        where: { slug: metric.slug },
        update: {
          name: metric.name,
          description: metric.description,
          category: metric.category,
          kind: metric.kind,
          unit: metric.unit,
          frequency: metric.frequency,
          formula: metric.formula,
          dependencies: metric.dependencies,
          isProxy: metric.isProxy ?? false,
          displayWarning: metric.displayWarning,
          tags: metric.tags,
          metadata: (metric.metadata ?? {}) as Prisma.JsonObject,
          methodologyNoteId: metric.methodologyNoteSlug
            ? methodologyBySlug.get(metric.methodologyNoteSlug) ?? null
            : null
        },
        create: {
          slug: metric.slug,
          name: metric.name,
          description: metric.description,
          category: metric.category,
          kind: metric.kind,
          unit: metric.unit,
          frequency: metric.frequency,
          formula: metric.formula,
          dependencies: metric.dependencies,
          isProxy: metric.isProxy ?? false,
          displayWarning: metric.displayWarning,
          tags: metric.tags,
          metadata: (metric.metadata ?? {}) as Prisma.JsonObject,
          methodologyNoteId: metric.methodologyNoteSlug
            ? methodologyBySlug.get(metric.methodologyNoteSlug) ?? null
            : null
        }
      });
    }
  }
}
