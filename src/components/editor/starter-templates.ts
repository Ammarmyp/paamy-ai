import {
  DEFAULT_EDGE_COLOR,
  NODE_COLORS,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function colorFill(index: number): string {
  return NODE_COLORS[index % NODE_COLORS.length].fill
}

function templateNode(
  id: string,
  label: string,
  shape: NodeShape,
  colorIndex: number,
  x: number,
  y: number,
  size?: Partial<{ width: number; height: number }>,
): CanvasNode {
  const defaults = SHAPE_DEFAULT_SIZES[shape]
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    width: size?.width ?? defaults.width,
    height: size?.height ?? defaults.height,
    data: {
      label,
      color: colorFill(colorIndex),
      shape,
    },
  }
}

function templateEdge(
  id: string,
  source: string,
  target: string,
  label = "",
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    data: { label },
    style: {
      stroke: DEFAULT_EDGE_COLOR,
      strokeWidth: 1.25,
    },
  }
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description:
    "API gateway in front of auth, catalog, and orders services with shared data stores.",
  nodes: [
    templateNode("ms-clients", "Clients", "hexagon", 1, 40, 160),
    templateNode("ms-gateway", "API Gateway", "pill", 7, 280, 160),
    templateNode("ms-auth", "Auth Service", "rectangle", 2, 540, 40),
    templateNode("ms-catalog", "Catalog Service", "rectangle", 6, 540, 160),
    templateNode("ms-orders", "Orders Service", "rectangle", 3, 540, 280),
    templateNode("ms-users-db", "Users DB", "cylinder", 2, 800, 20),
    templateNode("ms-catalog-db", "Catalog DB", "cylinder", 6, 800, 160),
    templateNode("ms-orders-db", "Orders DB", "cylinder", 3, 800, 300),
  ],
  edges: [
    templateEdge("ms-e1", "ms-clients", "ms-gateway", "HTTPS"),
    templateEdge("ms-e2", "ms-gateway", "ms-auth"),
    templateEdge("ms-e3", "ms-gateway", "ms-catalog"),
    templateEdge("ms-e4", "ms-gateway", "ms-orders"),
    templateEdge("ms-e5", "ms-auth", "ms-users-db"),
    templateEdge("ms-e6", "ms-catalog", "ms-catalog-db"),
    templateEdge("ms-e7", "ms-orders", "ms-orders-db"),
  ],
}

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description:
    "Source control through build, test, and deploy stages into staging and production.",
  nodes: [
    templateNode("ci-repo", "Git Repo", "cylinder", 1, 40, 140),
    templateNode("ci-build", "Build", "pill", 7, 260, 140),
    templateNode("ci-test", "Test", "diamond", 3, 460, 120),
    templateNode("ci-artifact", "Artifacts", "cylinder", 2, 660, 40),
    templateNode("ci-staging", "Staging", "rectangle", 6, 660, 180),
    templateNode("ci-prod", "Production", "hexagon", 4, 900, 180),
    templateNode("ci-notify", "Notify", "circle", 5, 900, 40, {
      width: 90,
      height: 90,
    }),
  ],
  edges: [
    templateEdge("ci-e1", "ci-repo", "ci-build", "push"),
    templateEdge("ci-e2", "ci-build", "ci-test"),
    templateEdge("ci-e3", "ci-test", "ci-artifact", "pass"),
    templateEdge("ci-e4", "ci-test", "ci-staging", "pass"),
    templateEdge("ci-e5", "ci-staging", "ci-prod", "promote"),
    templateEdge("ci-e6", "ci-artifact", "ci-notify"),
    templateEdge("ci-e7", "ci-prod", "ci-notify", "status"),
  ],
}

const projectStructure: CanvasTemplate = {
  id: "project-structure",
  name: "Project Structure",
  description:
    "App shell with UI, API, domain, and infrastructure layers for a typical codebase map.",
  nodes: [
    templateNode("ps-app", "App Shell", "hexagon", 7, 360, 20),
    templateNode("ps-ui", "UI Layer", "rectangle", 1, 40, 180),
    templateNode("ps-api", "API Layer", "pill", 2, 280, 180),
    templateNode("ps-domain", "Domain", "rectangle", 6, 520, 180),
    templateNode("ps-infra", "Infrastructure", "cylinder", 3, 760, 160),
    templateNode("ps-auth", "Auth", "diamond", 5, 160, 340),
    templateNode("ps-db", "Database", "cylinder", 6, 520, 340),
    templateNode("ps-queue", "Queue", "pill", 3, 760, 340),
  ],
  edges: [
    templateEdge("ps-e1", "ps-app", "ps-ui"),
    templateEdge("ps-e2", "ps-app", "ps-api"),
    templateEdge("ps-e3", "ps-app", "ps-domain"),
    templateEdge("ps-e4", "ps-api", "ps-domain"),
    templateEdge("ps-e5", "ps-ui", "ps-auth"),
    templateEdge("ps-e6", "ps-api", "ps-auth"),
    templateEdge("ps-e7", "ps-domain", "ps-db"),
    templateEdge("ps-e8", "ps-domain", "ps-infra"),
    templateEdge("ps-e9", "ps-infra", "ps-queue"),
  ],
}

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description:
    "Producers publish domain events through a bus to consumers and read models.",
  nodes: [
    templateNode("ed-producer", "Order Service", "rectangle", 3, 40, 160),
    templateNode("ed-bus", "Event Bus", "pill", 7, 300, 160),
    templateNode("ed-inventory", "Inventory", "rectangle", 6, 560, 40),
    templateNode("ed-billing", "Billing", "rectangle", 2, 560, 160),
    templateNode("ed-notify", "Notifications", "rectangle", 5, 560, 280),
    templateNode("ed-read", "Read Model", "cylinder", 1, 820, 140),
    templateNode("ed-dlq", "Dead Letter", "hexagon", 4, 300, 320),
  ],
  edges: [
    templateEdge("ed-e1", "ed-producer", "ed-bus", "OrderPlaced"),
    templateEdge("ed-e2", "ed-bus", "ed-inventory"),
    templateEdge("ed-e3", "ed-bus", "ed-billing"),
    templateEdge("ed-e4", "ed-bus", "ed-notify"),
    templateEdge("ed-e5", "ed-inventory", "ed-read", "project"),
    templateEdge("ed-e6", "ed-billing", "ed-read", "project"),
    templateEdge("ed-e7", "ed-bus", "ed-dlq", "failed"),
  ],
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  projectStructure,
  eventDriven,
]
