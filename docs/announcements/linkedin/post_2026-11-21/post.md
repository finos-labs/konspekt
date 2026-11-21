---
platform: linkedin
format: feed
date: 2026-11-21
url: https://www.linkedin.com/feed/update/urn:li:activity:7529948671493468160/
announces: "clickable source references and a connections list with a pop-out graph in the konspekt view (IntelliJ plugin 0.0.18), shown on the konspekt repository and on finos-hack/cdm-collateral (CDM collateral workflows on Hyperledger Besu, with tokenized collateral)"
carousel: carousel.pdf      # 7-page PDF uploaded to LinkedIn as a document; assembled from images/ by build_carousel.py
assets:
  - file: carousel.pdf
    source: docs/announcements/linkedin/post_2026-11-21/build_carousel.py
    alt: Seven slides, one per screenshot below, each with a numbered caption.
  - file: images/1_details_with_links.png
    alt: The atom drawer for task-ui-clickable-source-refs, Provenance tab. The extraction and each review or status change are listed with their ni:///sha-256 references shown as links.
  - file: images/2_provenance_source_link.png
    alt: The same drawer after clicking the extraction reference. It shows the store location as a GitHub link, the ni reference, and the verbatim conversation excerpt the task was created from.
  - file: images/3_details_with_list_and_popup.png
    alt: The Connections frame at the bottom of the drawer. Three connected atoms grouped by edge kind, one decomposes edge from goal-usability and two marks edges from release waypoints, with a Pop out graph button.
  - file: images/4_graph_konspekt_depth2.png
    alt: The pop-out graph centered on task-ui-clickable-source-refs at depth two, 27 of 337 entities, with the task, its goal, the two release waypoints and the goal's other tasks.
  - file: images/5_graph_konspekt_full.png
    alt: The pop-out graph of the whole konspekt repository instance, 337 entities and 529 edges.
  - file: images/6_graph_cdm_depth2.png
    alt: The pop-out graph in finos-hack/cdm-collateral, centered on goal-cdm-development at depth two, 104 of 274 entities.
  - file: images/7_graph_cdm_full.png
    alt: The pop-out graph of the whole cdm-collateral instance, 274 entities and 442 edges.
first_comment: |
  Plugin release: https://github.com/finos-labs/konspekt/releases/tag/intellij-plugin-v0.0.18
  CDM Collateral: https://github.com/finos-hack/cdm-collateral
  Hyperledger Besu: https://github.com/besu-eth/besu
  Repo: https://github.com/finos-labs/konspekt
---

konspekt records a project's goals, tasks, decisions and notes as a graph of atoms. Each atom points to the verbatim conversation excerpt it was created from. This week we made those pointers clickable and made the graph visible from any atom. Both changes are in the standalone view and in IntelliJ plugin 0.0.18.

1. Source references are links. The Provenance tab of an atom lists every reference that bears on it: the excerpt it was extracted from, each review and status change with the excerpt behind it, and its origin locators.

2. One click opens the source. The drawer shows the verbatim excerpt, its ni: reference and its location in the store. In this repository the location is a GitHub URL, which opens in the browser.

3. Connections. The drawer lists every atom connected to the current one, in both directions, grouped by edge kind. A proposed edge is dashed. "Pop out graph" opens the graph around the atom, with zoom, pan, depth 1, 2 or all, edge-kind filters and search by id.

4. Depth two around one task in the konspekt repository: 27 of 337 atoms. The task links to its goal and to the two plugin releases that shipped it, and the goal links to the other usability tasks.

5. The whole konspekt graph: 337 atoms, 529 edges.

6. The same view in CDM Collateral (https://github.com/finos-hack/cdm-collateral), a project we just made public in FINOS. It is a prototype that uses the FINOS Common Domain Model as the data standard for collateral management workflows, with each of its 47 workflows settled on a private Hyperledger Besu network (https://github.com/besu-eth/besu). It also covers tokenized collateral: a CDM extension represents a tokenized asset as it exists on its ledger, with its security identifier (ISIN or CUSIP), its ISO 24165 DTI where one exists, its network, token contract and token standard, and which record is legally authoritative. Depth two around its development goal: 104 of 274 atoms.

7. The whole CDM Collateral graph: 274 atoms, 442 edges.

Links to the release, CDM Collateral, Besu and the konspekt repo in the comments.

#AI #LLM #KnowledgeGraphs #OpenSource #FINOS #CDM #Tokenization #HyperledgerBesu #konspekt
