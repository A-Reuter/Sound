import {Injectable} from '@angular/core';

import {SettingsService} from '../config/settings.service';

import {Net} from '../../classes/net-representation/net';
import {Node} from '../../classes/net-representation/node';

@Injectable({
    providedIn: 'root',
})
export class RenderService {
    
    /* attributes */

    // /* do not remove - initial parameters */
    //
    // private readonly MAX_ITERATIONS     : number = 20000;
    // private readonly MIN_MOVEMENT       : number = 0.1;
    // private readonly SPRING_CONSTANT    : number = 0.004;
    // private readonly REPULSION_CONSTANT : number = 50;
    // private readonly DAMPING_FACTOR     : number = 0.9;
    //
    // /* do not remove - alternative parameters */
    //
    // private readonly MAX_ITERATIONS     : number = 20000;
    // private readonly MIN_MOVEMENT       : number = 0.1;
    // private readonly SPRING_LENGTH      : number = 100;
    // private readonly SPRING_CONSTANT    : number = 0.004;
    // private readonly REPULSION_CONSTANT : number = 1000;
    // private readonly DAMPING_FACTOR     : number = 0.9;

    /* methods - constructor */
    
        public constructor(
            private readonly settingsService: SettingsService
        ) {}

    /* methods - other */

    public roundNodeCoordinates(inoutNet : Net) : Net {
        inoutNet.nodes.forEach(
            node => {
                if (node) {
                    node.x = Math.round(node.x);
                    node.y = Math.round(node.y);
                };
            }
        );
        return inoutNet;
    };

    public orderLeftRight(inoutNet : Net) : Net {
        for (const node of inoutNet.nodes) {
            if (node) {
                node.x = ((Math.random() * 2) - 1);
                node.y = ((Math.random() * 2) - 1);
            };
        };
        for (const source of inoutNet.sourcePlaces) {
            source.x = -10000;
        };
        for (const sink of inoutNet.sinkPlaces) {
            sink.x = 10000
        };
        this.applySpringEmbedder(inoutNet, [], 500);
        return inoutNet;
    };

    public applySpringEmbedder(inoutNet : Net, inStaticNodes : Node[], inIterationOverwrite? : number) : Net {
        let MAX_ITERATIONS     : number;
        let MIN_MOVEMENT       : number;
        let FORCE_MIN          : number;
        let FORCE_MAX          : number;
        let SPRING_LENGTH      : number;
        let SPRING_CONSTANT    : number;
        let REPULSION_CONSTANT : number;
        switch (this.settingsService.state.springEmbedderTethering) {
            case 'loose' : {
                MAX_ITERATIONS     = 20;
                MIN_MOVEMENT       = 0.5;
                FORCE_MIN          = -100;
                FORCE_MAX          = 100;
                SPRING_LENGTH      = 100;
                SPRING_CONSTANT    = 0.05;
                REPULSION_CONSTANT = 15000;
                break;
            }
            case 'balanced' : {
                MAX_ITERATIONS     = 25;
                MIN_MOVEMENT       = 1;
                FORCE_MIN          = -200;
                FORCE_MAX          = 200;
                SPRING_LENGTH      = 100;
                SPRING_CONSTANT    = 0.09;
                REPULSION_CONSTANT = 30000;
                break;
            }
            case 'tight' : {
                MAX_ITERATIONS     = 30;
                MIN_MOVEMENT       = 2;
                FORCE_MIN          = -300;
                FORCE_MAX          = 300;
                SPRING_LENGTH      = 100;
                SPRING_CONSTANT    = 0.12;
                REPULSION_CONSTANT = 60000;
                break;
            }
        };
        if (inIterationOverwrite) {
            MAX_ITERATIONS = inIterationOverwrite;
        };
        let iteration = 0;
        let maxMovement = MIN_MOVEMENT + 1;
        // /* do not remove - alternative implementation */
        // this.initializeNodePositions(graph, this.graphicsConfig.canvasWidth, this.graphicsConfig.canvasHeight)
        while (iteration < MAX_ITERATIONS && maxMovement > MIN_MOVEMENT) {
            const forces : Map<Node, {x: number; y: number}> = new Map();
            /* calculate forces */
            for (const nodeA of inoutNet.nodes) {
                if (!nodeA) continue; /* safeguard against undefined nodes */
                let isStatic : boolean = false;
                for (const node of inStaticNodes) {
                    if (nodeA === node) {
                        isStatic = true;
                        break;
                    };
                };
                if (isStatic) continue; /* do not apply forces to static node */
                let netForceX : number = 0;
                let netForceY : number = 0;
                /* calculate repulsion */
                for (const nodeB of inoutNet.nodes) {
                    if (!nodeB) continue; /* safeguard against undefined nodes */
                    if (nodeA === nodeB) continue; /* safeguard against self-comparison */
                    const dx : number = (nodeB.x - nodeA.x);
                    const dy : number = (nodeB.y - nodeA.y);
                    const distance : number = ((Math.sqrt((dx * dx) + (dy * dy))) || (1)); /* avoid division by zero */
                    const repulsionForce : number = (REPULSION_CONSTANT / (distance * distance)); /* reduce attraction with distance */
                    // /* do not remove - alternative implementation */
                    // const repulsionForce = REPULSION_CONSTANT / distance;
                    netForceX -= ((repulsionForce * dx) / distance);
                    netForceY -= ((repulsionForce * dy) / distance);
                };
                /* calculate attraction */
                for (const arc of inoutNet.arcs) {
                    if (!arc) continue; /* safeguard against undefined arcs */
                    if ((arc.source === nodeA) || (arc.target === nodeA)) {
                        const nodeB : Node = (arc.source === nodeA ? arc.target : arc.source);
                        if (!nodeB) continue; /* safeguard against undefined target or source */
                        const dx : number = (nodeB.x - nodeA.x);
                        const dy : number = (nodeB.y - nodeA.y);
                        const distance : number = ((Math.sqrt((dx * dx) + (dy * dy))) || (0.1)); /* avoid division by zero */
                        const delta : number = (distance - SPRING_LENGTH);
                        const attractionForce : number = (SPRING_CONSTANT * delta);
                        // /* do not remove - alternative implementation */
                        // const attractionForce = SPRING_CONSTANT * distance;
                        netForceX += ((attractionForce * dx) / distance);
                        netForceY += ((attractionForce * dy) / distance);
                    };
                };
                forces.set(nodeA, {x: netForceX, y: netForceY});
            };
            /* apply forces */
            maxMovement = 0;
            for (const node of inoutNet.nodes) {
                if (!node) continue; /* safeguard against undefined nodes */
                const force = forces.get(node);
                if (!force) continue; /* safeguard against missing force data */
                const dx = Math.min(Math.max(force.x, FORCE_MIN), FORCE_MAX);
                const dy = Math.min(Math.max(force.y, FORCE_MIN), FORCE_MAX);
                // /* do not remove - alternative implementation */
                // const dx = force.x * DAMPING_FACTOR;
                // const dy = force.y * DAMPING_FACTOR;
                const newX = node.x + dx;
                const newY = node.y + dy;
                node.x = newX;
                node.y = newY;
                const movement = Math.sqrt(dx * dx + dy * dy);
                if (movement > maxMovement) {
                    maxMovement = movement
                };
            };
            iteration++;
        };
        inoutNet = this.roundNodeCoordinates(inoutNet);
        return inoutNet;
    };

    private initializeNodePositions(inoutNet : Net, inCanvasWidth : number, inCanvasHeight: number): void {
        const radius = Math.min(inCanvasWidth, inCanvasHeight) / 4; /* use 1/4 of the smaller dimension for radius */
        const centerX = inCanvasWidth / 2; /* dynamically calculate center based on canvas width */
        const centerY = inCanvasHeight / 2; /* dynamically calculate center based on canvas height */
        const totalNodes = inoutNet.nodes.length;
        inoutNet.nodes.forEach(
            (node, index) => {
                if (node) { /* check if node is not undefined */
                    node.x = centerX + radius * Math.cos((2 * Math.PI * index) / totalNodes);
                    node.y = centerY + radius * Math.sin((2 * Math.PI * index) / totalNodes);
                };
            }
        );
    };

};