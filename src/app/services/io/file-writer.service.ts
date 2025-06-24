import {Injectable} from '@angular/core';

import {PopupService} from '../notifications/popup.service';

import {Arc} from '../../classes/net-representation/arc';
import {Coords} from '../../classes/file-management/coordinates';
import {JsonPetriNet} from '../../classes/file-management/json-petri-net';
import {JsonSoundSave} from '../../classes/file-management/json-sound-save';
import {Net} from '../../classes/net-representation/net';
import {Node} from '../../classes/net-representation/node';

@Injectable({
    providedIn: 'root'
})
export class FileWriterService {

    /* methods : constructor */

    public constructor(
        private readonly popupService : PopupService,
    ) {};

    /* methods : other */

    public writeToJSON(inFileName : string, inNet : Net) : void {
        const jsonPetriNet : JsonPetriNet = this.netToJSON(inNet);
        const jsonString : string = JSON.stringify(jsonPetriNet, null, 2);
        const jsonName : string = (inFileName + '.json');
        const jsonFile : File = new File([jsonString], jsonName);
        const jsonLink : HTMLAnchorElement = document.createElement("a");
        jsonLink.href = URL.createObjectURL(jsonFile);
        jsonLink.download = jsonName;
        jsonLink.click();
        jsonLink.remove();
    };

    public writeToPNML(inFileName : string, inNet : Net) : void {
        const pnmlString : string = this.netToPNML(inNet);
        const pnmlName : string = (inFileName + '.pnml');
        const pnmlFile : File = new File([pnmlString], pnmlName);
        const pnmlLink : HTMLAnchorElement = document.createElement("a");
        pnmlLink.href = URL.createObjectURL(pnmlFile);
        pnmlLink.download = pnmlName;
        pnmlLink.click();
        pnmlLink.remove();
    };

    public writeToSAV(inFileName : string, inNet : Net) : void {
        const jsonSoundSave : JsonSoundSave = this.netToSAV(inNet);
        const jsonString : string = JSON.stringify(jsonSoundSave, null, 4);
        const jsonName : string = (inFileName + '.sav');
        const jsonFile : File = new File([jsonString], jsonName);
        const jsonLink : HTMLAnchorElement = document.createElement("a");
        jsonLink.href = URL.createObjectURL(jsonFile);
        jsonLink.download = jsonName;
        jsonLink.click();
        jsonLink.remove();
    };

    public writeToTXT(inFileName : string, inNet : Net) : void {
        const txtString : string = this.netToTXT(inNet);
        const txtName : string = (inFileName + '.txt');
        const txtFile : File = new File([txtString], txtName);
        const txtLink : HTMLAnchorElement = document.createElement("a");
        txtLink.href = URL.createObjectURL(txtFile);
        txtLink.download = txtName;
        txtLink.click();
        txtLink.remove();
    };

    private netToJSON(inNet : Net) : JsonPetriNet {
        const jsonPetriNet : JsonPetriNet = {
            places : [], 
            transitions : []
        };
        let jpnPlaces : string[] = [];
        let jpnTransitions : string[] = [];
        let jpnArcs : {
            [nodeIdPair : string] : number
        } = {};
        let jpnLabels : {
            [transitionId : string] : string
        } = {};
        let jpnMarking : {
            [placeId : string] : number
        } = {};
        let jpnLayout : {
            [id_or_idPair : string] : (Coords | Coords[])
        } = {};
        const jsonNodeIds : {
            [netNodeId : number] : string
        } = {};
        let labelFound : boolean = false;
        let placeCount : number = 0;
        for (const place of inNet.places) {
            placeCount++;
            const placeId : string = ('p' + placeCount);
            jpnPlaces.push(placeId);
            // /* do not remove - alternative implementation (place labels are not part of the original definition of a JsonPetriNet) */
            // if (place.label) {
            //     jpnLabels[placeId] = place.label;
            //     labelFound = true;
            // };
            jpnMarking[placeId] = place.initialMarking;
            // /* do not remove - alternative implementation (saving current marking instead of initial marking) */
            // jpnMarking[placeId] = place.marking
            jpnLayout[placeId] = {x: place.x, y: place.y};
            jsonNodeIds[place.id] = placeId;
        };
        let transitionCount : number = 0;
        for (const transition of inNet.transitions) {
            transitionCount++;
            const transitionId : string = ('t' + transitionCount);
            jpnTransitions.push(transitionId);
            if (transition.label) {
                jpnLabels[transitionId] = transition.label;
                labelFound = true;
            };
            jpnLayout[transitionId] = {x: transition.x, y: transition.y};
            jsonNodeIds[transition.id] = transitionId;
        };
        const nodeCount : number = (placeCount + transitionCount);
        let netNodeCount : number = 0;
        let netPlaceCount : number = 0;
        let netTransitionCount : number = 0;
        for (const node of inNet.nodes) {
            if (node) {
                netNodeCount++;
                switch (node.type) {
                    case 'place' : {
                        netPlaceCount++;
                        break;
                    }
                    case 'transition' : {
                        netTransitionCount++;
                        break;
                    }
                };
            };
        };
        if ((placeCount !== inNet.places.length) || (placeCount !== netPlaceCount)) {
            this.popupService.error('srv.fws.ntj.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntj.000: ' + 'conversion of net to json failed - diverging place counts detected (net.nodes.counted.places' + netPlaceCount + ', net.places.arraylength' + inNet.places.length + ', converted.places' + placeCount + ')');
        };
        if ((transitionCount !== inNet.transitions.length) || (transitionCount !== netTransitionCount)) {
            this.popupService.error('srv.fws.ntj.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntj.001: ' + 'conversion of net to json failed - diverging transition counts detected (net.nodes.counted.transitions' + netTransitionCount + ', net.transitions.arraylength' + inNet.transitions.length + ', converted.transitions' + transitionCount + ')');
        };
        if ((nodeCount !== inNet.nodeCount) || (nodeCount !== netNodeCount)) {
            this.popupService.error('srv.fws.ntj.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntj.002: ' + 'conversion of net to json failed - diverging node counts detected (net.nodecount: ' + inNet.nodeCount + ', net.nodes.arraylength: ' + inNet.nodes.length + ', net.nodes.counted: ' + netNodeCount + ', converted.total: ' + nodeCount + ')');
        };
        let arcCount : number = 0;
        for (const arc of inNet.arcs) {
            if (arc) {
                arcCount = arcCount + arc.weight;
                const arcId : string = (jsonNodeIds[arc.source.id] + ',' + jsonNodeIds[arc.target.id]);
                jpnArcs[arcId] = arc.weight;
                jpnLayout[arcId] = [{x: arc.source.x, y: arc.source.y}, {x: arc.target.x, y: arc.target.y}];
            };
        };
        if (arcCount !== inNet.arcCount) {
            this.popupService.error('srv.fws.ntj.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntj.003: ' + 'conversion of net to json failed - diverging arc counts detected (net.arccount: ' + inNet.arcCount + ', net.arcs.arraylength' + inNet.arcs.length + ', converted.arcs' + arcCount + ')');
        };
        jsonPetriNet.places = jpnPlaces;
        jsonPetriNet.transitions = jpnTransitions;
        if (arcCount > 0) {
            jsonPetriNet.arcs = jpnArcs;
        };
        if (labelFound) {
            jsonPetriNet.labels = jpnLabels;
        };
        jsonPetriNet.marking = jpnMarking;
        jsonPetriNet.layout = jpnLayout;
        return jsonPetriNet;
    };

    private netToPNML(inNet : Net) : string {
        let pnmlString : string = '';
        let placeString : string = '';
        let transitionString : string = '';
        let arcString : string = '';
        const pnmlNodeIds : {
            [netNodeId: number]: string
        } = {};
        let placeCount : number = 0;
        for (const place of inNet.places) {
            placeCount++;
            const placeId : string = ('p' + placeCount);
            pnmlNodeIds[place.id] = placeId;
            placeString = (placeString + '    <place id="' + placeId + '">' + '\n');
            if (place.label) {
                placeString = (placeString + '      <name>' + '\n');
                placeString = (placeString + '        <text>' + '\n');
                placeString = (placeString + '          ' + place.label + '\n');
                placeString = (placeString + '        </text>' + '\n');
                placeString = (placeString + '      </name>' + '\n');
            };
            placeString = (placeString + '      <graphics>' + '\n');
            placeString = (placeString + '        <position x="' + place.x + '" y="' + place.y + '"/>' + '\n');
            placeString = (placeString + '      </graphics>' + '\n');
            placeString = (placeString + '      <initialMarking>' + '\n');
            placeString = (placeString + '        <text>' + '\n');
            placeString = (placeString + '          ' + place.initialMarking + '\n');
            placeString = (placeString + '        </text>' + '\n');
            placeString = (placeString + '      </initialMarking>' + '\n');
            placeString = (placeString + '    </place>' + '\n');
        };
        let transitionCount : number = 0;
        for (const transition of inNet.transitions) {
            transitionCount++;
            const transitionId : string = ('t' + transitionCount);
            pnmlNodeIds[transition.id] = transitionId;
            transitionString = (transitionString + '    <transition id="' + transitionId + '">' + '\n');
            if (transition.label) {
                transitionString = (transitionString + '      <name>' + '\n');
                transitionString = (transitionString + '        <text>' + '\n');
                transitionString = (transitionString + '          ' + transition.label + '\n');
                transitionString = (transitionString + '        </text>' + '\n');
                transitionString = (transitionString + '      </name>' + '\n');
            };
            transitionString = (transitionString + '      <graphics>' + '\n');
            transitionString = (transitionString + '        <position x="' + transition.x + '" y="' + transition.y + '"/>' + '\n');
            transitionString = (transitionString + '      </graphics>' + '\n');
            transitionString = (transitionString + '    </transition>' + '\n');
        };
        const nodeCount : number = (placeCount + transitionCount);
        let netNodeCount : number = 0;
        let netPlaceCount : number = 0;
        let netTransitionCount : number = 0;
        for (const node of inNet.nodes) {
            if (node) {
                netNodeCount++;
                switch (node.type) {
                    case 'place' : {
                        netPlaceCount++;
                        break;
                    }
                    case 'transition' : {
                        netTransitionCount++;
                        break;
                    }
                };
            };
        };
        if ((placeCount !== inNet.places.length) || (placeCount !== netPlaceCount)) {
            this.popupService.error('srv.fws.ntp.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntp.000: ' + 'conversion of net to pnml failed - diverging place counts detected (net.nodes.counted.places' + netPlaceCount + ', net.places.arraylength' + inNet.places.length + ', converted.places' + placeCount + ')');
        };
        if ((transitionCount !== inNet.transitions.length) || (transitionCount !== netTransitionCount)) {
            this.popupService.error('srv.fws.ntp.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntp.001: ' + 'conversion of net to pnml failed - diverging transition counts detected (net.nodes.counted.transitions' + netTransitionCount + ', net.transitions.arraylength' + inNet.transitions.length + ', converted.transitions' + transitionCount + ')');
        };
        if ((nodeCount !== inNet.nodeCount) || (nodeCount !== netNodeCount)) {
            this.popupService.error('srv.fws.ntp.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntp.002: ' + 'conversion of net to pnml failed - diverging node counts detected (net.nodecount: ' + inNet.nodeCount + ', net.nodes.arraylength: ' + inNet.nodes.length + ', net.nodes.counted: ' + netNodeCount + ', converted.total: ' + nodeCount + ')');
        };
        let arcNum : number = 0;
        let arcCount : number = 0;
        for (const arc of inNet.arcs) {
            if (arc) {
                arcNum++;
                arcCount = arcCount + arc.weight;
                arcString = (arcString + '    <arc id="a' + arcNum + '" source="' + pnmlNodeIds[arc.source.id] + '" target="' + pnmlNodeIds[arc.target.id] + '">' + '\n');
                arcString = (arcString + '      <inscription>' + '\n');
                arcString = (arcString + '        <text>' + '\n');
                arcString = (arcString + '          ' + arc.weight + '\n');
                arcString = (arcString + '        </text>' + '\n');
                arcString = (arcString + '      </inscription>' + '\n');
                arcString = (arcString + '    </arc>' + '\n');
            };
        };
        if (arcCount !== inNet.arcCount) {
            this.popupService.error('srv.fws.ntp.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntp.003: ' + 'conversion of net to pnml failed - diverging arc counts detected (net.arccount: ' + inNet.arcCount + ', net.arcs.arraylength' + inNet.arcs.length + ', converted.arcs' + arcCount + ')');
        };
        pnmlString = (pnmlString + '<?xml version="1.0" encoding="UTF-8"?>' + '\n');
        pnmlString = (pnmlString + '<pnml xmlns="http://www.pnml.org/version-2009/grammar/pnml">' + '\n');
        pnmlString = (pnmlString + '  <net id="undefined" type="http://www.pnml.org/version-2009/grammar/ptnet">' + '\n');
        pnmlString = (pnmlString + placeString);
        pnmlString = (pnmlString + transitionString);
        pnmlString = (pnmlString + arcString);
        pnmlString = (pnmlString + '  </net>' + '\n');
        pnmlString = (pnmlString + '</pnml>');
        return pnmlString;
    };

    private netToSAV(inNet : Net) : JsonSoundSave {
        const jsonSoundSave : JsonSoundSave = {
            places : [], 
            transitions : [], 
            arcs : {}, 
            layout : {}, 
            labels : {}, 
            marking : {}, 
            marking_current : {}, 
            flag_marked : {}, 
            flag_visited : {
                log : {}, 
                past : {}, 
                next : {}
            }, 
            flag_error : {
                one : {}, 
                two : {}
            }, 
            net_empty : inNet.empty, 
            net_workflow : inNet.workflow, 
            sequence_unsaved : inNet.unsavedSequence, 
            sequence_next : inNet.nextSequenceEntry, 
            sequence_active : [], 
            sequence_log : []
        };
        const savNodeIds : {
            [netNodeId : number] : string
        } = {};
        const savArcIds : {
            [netArcId : number] : string
        } = {};
        let placeCount : number = 0;
        for (const place of inNet.places) {
            placeCount++;
            const placeId : string = ('p' + placeCount);
            savNodeIds[place.id] = placeId;
            jsonSoundSave.places.push(placeId);
            jsonSoundSave.layout[placeId] = {x: place.x, y: place.y};
            // if (place.label) {
                jsonSoundSave.labels[placeId] = place.label;
            // };
            jsonSoundSave.marking[placeId] = place.initialMarking;
            jsonSoundSave.marking_current[placeId] = place.marking;
            if (place.marked) {
                jsonSoundSave.flag_marked[placeId] = place.marked;
            };
            if (place.inSequenceLog) {
                jsonSoundSave.flag_visited.log[placeId] = place.inSequenceLog;
            };
            if (place.inSequencePast) {
                jsonSoundSave.flag_visited.past[placeId] = place.inSequencePast;
            };
            if (place.inSequenceNext) {
                jsonSoundSave.flag_visited.next[placeId] = place.inSequenceNext;
            };
            if (place.errorLevel1) {
                jsonSoundSave.flag_error.one[placeId] = place.errorLevel1;
            };
            if (place.errorLevel2) {
                jsonSoundSave.flag_error.two[placeId] = place.errorLevel2;
            };
        };
        let transitionCount : number = 0;
        for (const transition of inNet.transitions) {
            transitionCount++;
            const transitionId : string = ('t' + transitionCount);
            savNodeIds[transition.id] = transitionId;
            jsonSoundSave.transitions.push(transitionId);
            jsonSoundSave.layout[transitionId] = {x: transition.x, y: transition.y};
            // if (transition.label) {
                jsonSoundSave.labels[transitionId] = transition.label;
            // };
            if (transition.marked) {
                jsonSoundSave.flag_marked[transitionId] = transition.marked;
            };
            if (transition.inSequenceLog) {
                jsonSoundSave.flag_visited.log[transitionId] = transition.inSequenceLog;
            };
            if (transition.inSequencePast) {
                jsonSoundSave.flag_visited.past[transitionId] = transition.inSequencePast;
            };
            if (transition.inSequenceNext) {
                jsonSoundSave.flag_visited.next[transitionId] = transition.inSequenceNext;
            };
            if (transition.errorLevel1) {
                jsonSoundSave.flag_error.one[transitionId] = transition.errorLevel1;
            };
            if (transition.errorLevel2) {
                jsonSoundSave.flag_error.two[transitionId] = transition.errorLevel2;
            };
        };
        const nodeCount : number = (placeCount + transitionCount);
        let netNodeCount : number = 0;
        let netPlaceCount : number = 0;
        let netTransitionCount : number = 0;
        for (const node of inNet.nodes) {
            if (node) {
                netNodeCount++;
                switch (node.type) {
                    case 'place' : {
                        netPlaceCount++;
                        break;
                    }
                    case 'transition' : {
                        netTransitionCount++;
                        break;
                    }
                };
            };
        };
        if ((placeCount !== inNet.places.length) || (placeCount !== netPlaceCount)) {
            this.popupService.error('srv.fws.nts.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.nts.000: ' + 'conversion of net to sav failed - diverging place counts detected (net.nodes.counted.places' + netPlaceCount + ', net.places.arraylength' + inNet.places.length + ', converted.places' + placeCount + ')');
        };
        if ((transitionCount !== inNet.transitions.length) || (transitionCount !== netTransitionCount)) {
            this.popupService.error('srv.fws.nts.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.nts.001: ' + 'conversion of net to sav failed - diverging transition counts detected (net.nodes.counted.transitions' + netTransitionCount + ', net.transitions.arraylength' + inNet.transitions.length + ', converted.transitions' + transitionCount + ')');
        };
        if ((nodeCount !== inNet.nodeCount) || (nodeCount !== netNodeCount)) {
            this.popupService.error('srv.fws.nts.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.nts.002: ' + 'conversion of net to sav failed - diverging node counts detected (net.nodecount: ' + inNet.nodeCount + ', net.nodes.arraylength: ' + inNet.nodes.length + ', net.nodes.counted: ' + netNodeCount + ', converted.total: ' + nodeCount + ')');
        };
        let arcCount : number = 0;
        for (const arc of inNet.arcs) {
            if (arc) {
                arcCount = arcCount + arc.weight;
                const arcId : string = (savNodeIds[arc.source.id] + ',' + savNodeIds[arc.target.id]);
                savArcIds[arc.id] = arcId;
                jsonSoundSave.arcs[arcId] = arc.weight;
                jsonSoundSave.layout[arcId] = [{x: arc.source.x, y: arc.source.y}, {x: arc.target.x, y: arc.target.y}];
                if (arc.marked) {
                    jsonSoundSave.flag_marked[arcId] = arc.marked;
                };
                if (arc.inSequenceLog) {
                    jsonSoundSave.flag_visited.log[arcId] = arc.inSequenceLog;
                };
                if (arc.inSequencePast) {
                    jsonSoundSave.flag_visited.past[arcId] = arc.inSequencePast;
                };
                if (arc.inSequenceNext) {
                    jsonSoundSave.flag_visited.next[arcId] = arc.inSequenceNext;
                };
                if (arc.errorLevel1) {
                    jsonSoundSave.flag_error.one[arcId] = arc.errorLevel1;
                };
                if (arc.errorLevel2) {
                    jsonSoundSave.flag_error.two[arcId] = arc.errorLevel2;
                };
            };
        };
        if (arcCount !== inNet.arcCount) {
            this.popupService.error('srv.fws.nts.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.nts.003: ' + 'conversion of net to sav failed - diverging arc counts detected (net.arccount: ' + inNet.arcCount + ', net.arcs.arraylength' + inNet.arcs.length + ', converted.arcs' + arcCount + ')');
        };
        for (const seqEntry of inNet.activeSequence) {
            const added : string[] = [];
            for (const elem of seqEntry.addedToSequence) {
                if (elem instanceof Arc) {
                    added.push(savArcIds[elem.id]);
                } else {
                    added.push(savNodeIds[elem.id]);
                };
            };
            jsonSoundSave.sequence_active.push({
                fired : (savNodeIds[seqEntry.firedTransition.id]), 
                added : (added), 
                valid : (seqEntry.markingValidity)
            });
        };
        for (const logSequence of inNet.simulationLog) {
            if (logSequence.length > 0) {
                const savSequence : {fired : string, added : string[], valid : boolean}[] = [];
                for (const seqEntry of logSequence) {
                    const added : string[] = [];
                    for (const elem of seqEntry.addedToSequence) {
                        if (elem instanceof Arc) {
                            added.push(savArcIds[elem.id]);
                        } else {
                            added.push(savNodeIds[elem.id]);
                        };
                    };
                    savSequence.push({
                        fired : (savNodeIds[seqEntry.firedTransition.id]), 
                        added : (added),
                        valid : (seqEntry.markingValidity)
                    });
                };
                jsonSoundSave.sequence_log.push(savSequence);
            } else {
                this.popupService.error('srv.fws.nts.004', 'inconsistent internal data state', 'it is recommended to restart the tool');
                throw new Error('#srv.fws.nts.004: ' + 'conversion of net to sav failed - firing sequence of length \'' + logSequence.length + '\' detected in the simulation log');
            };
        };
        return jsonSoundSave;
    };

    private netToTXT(inNet : Net) : string {
        let txtString : string = '';
        let placeString : string = '';
        let transitionString : string = '';
        let arcString : string = '';
        const txtNodeIds : {
            [netNodeId: number]: string
        } = {};
        let placeCount : number = 0;
        for (const place of inNet.places) {
            placeCount++;
            const placeId : string = ('p' + placeCount);
            txtNodeIds[place.id] = placeId;
            placeString = (placeString + placeId + ' ' + place.initialMarking + '\n');
        };
        let transitionCount : number = 0;
        for (const transition of inNet.transitions) {
            transitionCount++;
            const transitionId : string = ('t' + transitionCount);
            txtNodeIds[transition.id] = transitionId;
            const transitionName : string = transition.label.replace(' ', '_');
            transitionString = (transitionString + transitionId + ' ' + transitionName + '\n');
        };
        const nodeCount : number = (placeCount + transitionCount);
        let netNodeCount : number = 0;
        let netPlaceCount : number = 0;
        let netTransitionCount : number = 0;
        for (const node of inNet.nodes) {
            if (node) {
                netNodeCount++;
                switch (node.type) {
                    case 'place' : {
                        netPlaceCount++;
                        break;
                    }
                    case 'transition' : {
                        netTransitionCount++;
                        break;
                    }
                };
            };
        };
        if ((placeCount !== inNet.places.length) || (placeCount !== netPlaceCount)) {
            this.popupService.error('srv.fws.ntt.000', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntt.000: ' + 'conversion of net to txt failed - diverging place counts detected (net.nodes.counted.places' + netPlaceCount + ', net.places.arraylength' + inNet.places.length + ', converted.places' + placeCount + ')');
        };
        if ((transitionCount !== inNet.transitions.length) || (transitionCount !== netTransitionCount)) {
            this.popupService.error('srv.fws.ntt.001', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntt.001: ' + 'conversion of net to txt failed - diverging transition counts detected (net.nodes.counted.transitions' + netTransitionCount + ', net.transitions.arraylength' + inNet.transitions.length + ', converted.transitions' + transitionCount + ')');
        };
        if ((nodeCount !== inNet.nodeCount) || (nodeCount !== netNodeCount)) {
            this.popupService.error('srv.fws.ntt.002', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntt.002: ' + 'conversion of net to txt failed - diverging node counts detected (net.nodecount: ' + inNet.nodeCount + ', net.nodes.arraylength: ' + inNet.nodes.length + ', net.nodes.counted: ' + netNodeCount + ', converted.total: ' + nodeCount + ')');
        };
        let arcCount : number = 0;
        for (const arc of inNet.arcs) {
            if (arc) {
                arcCount = arcCount + arc.weight;
                arcString = (arcString + txtNodeIds[arc.source.id] + ' ' + txtNodeIds[arc.target.id] + ' ' + arc.weight + '\n');
            };
        };
        if (arcCount !== inNet.arcCount) {
            this.popupService.error('srv.fws.ntt.003', 'inconsistent internal data state', 'it is recommended to restart the tool');
            throw new Error('#srv.fws.ntt.003: ' + 'conversion of net to txt failed - diverging arc counts detected (net.arccount: ' + inNet.arcCount + ', net.arcs.arraylength' + inNet.arcs.length + ', converted.arcs' + arcCount + ')');
        };
        txtString = (txtString + '.type pn' + '\n');
        txtString = (txtString + '.transitions' + '\n');
        txtString = (txtString + transitionString);
        txtString = (txtString + '.places' + '\n');
        txtString = (txtString + placeString);
        txtString = (txtString + '.arcs' + '\n');
        txtString = (txtString + arcString);
        return txtString;
    };

};