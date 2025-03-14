document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("htmx:afterRequest", function (event) {
        console.log("HTMX request completed", event);

        // Ensure the request was successful and from "/upload"
        if (!event.detail.successful || event.detail.requestConfig.path !== "/upload") {
            console.warn("HTMX request failed or not an upload.");
            return;
        }

        // Extract the GEXF file URL from the response
        const gexfFileUrl = event.detail.xhr.responseText.trim();
        console.log("Received GEXF file URL:", gexfFileUrl);

        if (!gexfFileUrl) {
            console.error("Empty GEXF file URL received!");
            return;
        }

        // Load and render the graph
        loadAndRenderGraph(gexfFileUrl);
    });

    function loadAndRenderGraph(gexfFileUrl) {
        console.log("Loading GEXF file:", gexfFileUrl);

        const container = document.getElementById("sigma-container");
        if (!container) {
            console.error("Error: #sigma-container not found!");
            return;
        }

        container.innerHTML = ""; // Clear previous graph

        if (typeof sigma === "undefined") {
            console.error("Error: Sigma.js is not loaded!");
            return;
        }

        sigma.parsers.gexf(gexfFileUrl, {
            container: "sigma-container",
            settings: {
                defaultNodeColor: "#ec5148",
                defaultEdgeColor: "#ccc",
                edgeType: "curve",
                autoRescale: true,
                labelThreshold: 2,
                font: "Arial",
                labelSize: "fixed",
                labelColor: "node",
                mouseZoomDuration: 500,
                zoomingRatio: 1.2,
                minNodeSize: 3,
                maxNodeSize: 15,
                edgeProgramClasses: {
                    curved: EdgeCurveProgram,
                },
            }
        }, function (s) {
            console.log("Graph loaded successfully");

            const g = new dagre.graphlib.Graph();

            g.setGraph({ rankdir: "TB" });

            // Add nodes to Dagre
            s.graph.nodes().forEach(node => {
                g.setNode(node.id, { width: 100, height: 50 });
            });

            // Add edges to Dagre
            s.graph.edges().forEach(edge => {
                g.setEdge(edge.source, edge.target, {});
            });

            // Compute layout
            dagre.layout(g);

            // Apply computed positions to Sigma.js
            s.graph.nodes().forEach(node => {
                const pos = g.node(node.id);
                if (pos) {
                    node.x = pos.x;
                    node.y = pos.y; // Invert Y for better visualization
                    node.size = 8;
                    node.color = "#410445";
                    node.label = node.label || node.id;
                    node.labelColor = "#fff";
                    node.borderColor = "#2c3e50";
                    node.borderSize = 2;
                } else {
                    console.warn("Missing layout position for node:", node.id);
                }
            });

            s.graph.edges().forEach(edge => {
                edge.type = "bezier";
                edge.color = "#443627";
                edge.width = 4;
            });

            s.refresh(); // Make sure changes are applied

            // Node click event
            s.bind("clickNode", function (event) {
                const node = event.data.node;
                let attributesHtml = "<h3>Node Info</h3>";
            
                Object.entries(node).forEach(([key, value]) => {
                    attributesHtml += `<p><strong>${key}:</strong> ${value}</p>`;
                });
            
                document.getElementById("node-info").innerHTML = attributesHtml;
            });            

            s.bind("clickStage", function () {
                document.getElementById("node-info").innerHTML = "<p>Click a node to view its details.</p>";
            });
        });
    }
});
