function aStarAlgorithm(graph, start, goal) {
    let openSet = new Set([start]);
    let cameFrom = {};
    let gScore = {};
    let fScore = {};

    for (let node in graph) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = heuristic(start, goal);

    while (openSet.size > 0) {
        let current = [...openSet].reduce((a, b) => fScore[a] < fScore[b] ? a : b);

        if (current === goal) {
            return reconstructPath(cameFrom, current);
        }

        openSet.delete(current);

        for (let neighbor in graph[current]) {
            let tentative_gScore = gScore[current] + graph[current][neighbor];

            if (tentative_gScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentative_gScore;
                fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal);

                if (!openSet.has(neighbor)) {
                    openSet.add(neighbor);
                }
            }
        }
    }

    return null; // Jika tidak ada jalur
}

function heuristic(a, b) {
    let [ax, ay] = a.split(",").map(Number);
    let [bx, by] = b.split(",").map(Number);
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

function reconstructPath(cameFrom, current) {
    let totalPath = [current];

    while (current in cameFrom) {
        current = cameFrom[current];
        totalPath.unshift(current);
    }

    return totalPath;
}
