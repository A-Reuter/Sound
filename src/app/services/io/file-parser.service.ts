import {Injectable} from '@angular/core';

import {Coords} from '../../classes/file-management/coordinates';
import {JsonPetriNet} from '../../classes/file-management/json-petri-net';
import {JsonSoundSave} from '../../classes/file-management/json-sound-save';

import {Arc} from '../../classes/net-representation/arc';
import {Net} from '../../classes/net-representation/net';
import {Place} from '../../classes/net-representation/place';
import {Transition} from '../../classes/net-representation/transition';

import {PopupService} from '../notifications/popup.service';

@Injectable({
    providedIn: 'root'
})
export class FileParserService {

    /* attributes - own */

    private readonly _regexLineBreak : RegExp = /(\r|\n)+/g;

    /* methods : constructor */

    public constructor(
        private readonly popupService : PopupService
    ) {}

    /* methods : other */

    public parse(
        inFileContent : string, 
        inFileExtension : ('json' | 'pnml' | 'sav' | 'txt')
    ) : Net {
        if (inFileContent === '') {
            return (new Net);
        };
        let parsedNet : Net;
        switch (inFileExtension) {
            case 'json' : {
                parsedNet = this.parseJSON(this.preProcessRmv(inFileContent))
                break;
            }
            case 'pnml' : {
                parsedNet = this.parsePNML(this.preProcessRmv(inFileContent));
                break;
            }
            case 'sav' : {
                parsedNet = this.parseSAV(this.preProcessRmv(inFileContent))
                break;
            }
            case 'txt' : {
                parsedNet = this.parseTXT(this.preProcessRpl(inFileContent))
                break;
            }
        };
        return parsedNet;
    };

    private preProcessRmv(inFileContent : string) : string {
        const preprocessed : string = inFileContent.replace(this._regexLineBreak, '');
        return preprocessed;
    };

    private preProcessRpl(inFileContent : string) : string {
        const preprocessed : string = inFileContent.replace(this._regexLineBreak, '\n');
        return preprocessed;
    };

    private parseJSON(inJsonString : string) : Net {
        try {
            const jsonPetriNet = JSON.parse(inJsonString) as JsonPetriNet;
            const jsonNet : Net = new Net();
            const nodeIdMap : {
                [jsonNodeId : string] : (Place | Transition)
            } = {};
            for (const place of jsonPetriNet.places) {
                let placeLabel : string;
                if (jsonPetriNet.labels) {
                    if (jsonPetriNet.labels[place] !== undefined) {
                        placeLabel = (jsonPetriNet.labels[place]);
                    } else {
                        placeLabel = ('');
                    };
                } else {
                    placeLabel = ('');
                };
                let placeInitialMarking : number;
                if (jsonPetriNet.marking) {
                    if (jsonPetriNet.marking[place] !== undefined) {
                        placeInitialMarking = jsonPetriNet.marking[place];
                    } else {
                        placeInitialMarking = 0;
                    };
                } else {
                    placeInitialMarking = 0;
                };
                let placeX : (number | undefined);
                let placeY : (number | undefined);
                if (jsonPetriNet.layout) {
                    if (jsonPetriNet.layout[place] !== undefined) {
                        const placeCoords : Coords = (jsonPetriNet.layout[place] as Coords);
                        placeX = placeCoords.x;
                        placeY = placeCoords.y;
                    };
                };
                if (nodeIdMap[place] === undefined) {
                    nodeIdMap[place] = (jsonNet.addPlace(placeLabel, placeInitialMarking, placeX, placeY).obj_ref);
                } else {
                    if (nodeIdMap[place] instanceof Place) {
                        throw new Error('duplicate place id \'' + place + '\'');
                    } else {
                        throw new Error('duplicate node id \'' + place + '\'');
                    };
                };
            };
            for (const transition of jsonPetriNet.transitions) {
                let transitionLabel : string;
                if (jsonPetriNet.labels) {
                    if (jsonPetriNet.labels[transition] !== undefined) {
                        transitionLabel = (jsonPetriNet.labels[transition]);
                    } else {
                        transitionLabel = ('');
                    };
                } else {
                    transitionLabel = ('');
                };
                let transitionX : (number | undefined);
                let transitionY : (number | undefined);
                if (jsonPetriNet.layout) {
                    if (jsonPetriNet.layout[transition] !== undefined) {
                        const transitionCoords : Coords = (jsonPetriNet.layout[transition] as Coords);
                        transitionX = transitionCoords.x;
                        transitionY = transitionCoords.y;
                    };
                };
                if (nodeIdMap[transition] === undefined) {
                    nodeIdMap[transition] = (jsonNet.addTransition(transitionLabel, transitionX, transitionY).obj_ref);
                } else {
                    if (nodeIdMap[transition] instanceof Transition) {
                        throw new Error('duplicate transition id \'' + transition + '\'');
                    } else {
                        throw new Error('duplicate node id \'' + transition + '\'');
                    };
                };
            };
            for (const arc in jsonPetriNet.arcs) {
                const idPair : string[] = arc.split(',');
                if (idPair.length !== 2) {
                    throw new Error('could not parse source and target node information for arc with id \'' + arc + '\': expected 2 values, but got ' + idPair.length);
                };
                const arcSource : (Place | Transition | undefined) = nodeIdMap[idPair[0]];
                if (!arcSource) {
                    throw new Error('could not parse source node for arc with id \'' + arc + '\': unknown node id');
                };
                const arcTarget : (Place | Transition | undefined) = nodeIdMap[idPair[1]];
                if (!arcTarget) {
                    throw new Error('could not parse target node for arc with id \'' + arc + '\': unknown node id');
                };
                let arcPlace : Place;
                let arcTransition : Transition;
                let placeIsSource : boolean;
                if (arcSource instanceof Place) {
                    if (arcTarget instanceof Transition) {
                        arcPlace = arcSource;
                        arcTransition = arcTarget;
                        placeIsSource = true;
                    } else {
                        throw new Error('could not parse arc with id \'' + arc + '\': source and target node are both places');
                    };
                } else {
                    if (arcTarget instanceof Place) {
                        arcPlace = arcTarget;
                        arcTransition = arcSource;
                        placeIsSource = false;
                    } else {
                        throw new Error('could not parse arc with id \'' + arc + '\': source and target node are both transitions');
                    };
                };
                jsonNet.addArc(arcPlace, arcTransition, placeIsSource, jsonPetriNet.arcs[arc]);
            };
            return (jsonNet);
        } catch (error) {
            this.popupService.error('srv.fps.psj.000', 'failed to parse file content', 'consider checking the file content for structural errors');
            console.error('Error: #srv.fps.psj.000: ' + 'failed to parse .json-file', error);
            console.error('File: ', inJsonString);
            return (new Net);
        };
    };

    private parsePNML(inPnmlString : string) : Net {
        try {
            const parser = new DOMParser();
            const pnmlDocument = parser.parseFromString(inPnmlString,"application/xml");
            if (pnmlDocument.children.length === 1) {
                const docChildren = Array.from(pnmlDocument.children);
                const errElem : (Element | undefined) = docChildren.find(docChild => docChild.nodeName === "parsererror");
                if (errElem) {
                    throw new Error(errElem.textContent?.split('\n')[0]);
                };
            };
            const pnmlNet : Net = new Net();
            const nodeIdMap : {
                [pnmlNodeId : string] : (Place | Transition)
            } = {};
            const plcList : NodeListOf<Element> = pnmlDocument.querySelectorAll('place');
            if (plcList.length !== 0) {
                const plcArray : Element[] = Array.from(plcList);
                for (const plcElement of plcArray) {
                    const plcId : (string | undefined) = plcElement.attributes.getNamedItem('id')?.value;
                    if (!plcId) {
                        throw new Error('place element without id detected');
                    };
                    let plcMark : number = 0;
                    let plcLabel : string = '';
                    let plcCoordsX : (number | undefined);
                    let plcCoordsY : (number | undefined);
                    if (plcElement.hasChildNodes()) {
                        const plcChildren : Element[] = Array.from(plcElement.children);
                        const plcNameElement : (Element | undefined) = plcChildren.find(plcChild => plcChild.nodeName === "name");
                        if (plcNameElement && plcNameElement.hasChildNodes()) {
                            const plcNameChildren : Element[] = Array.from(plcNameElement.children);
                            const plcNameText : (Element | undefined) = plcNameChildren.find(plcNameChild => plcNameChild.nodeName === "text");
                            if (plcNameText) {
                                const plcText : (string | null | undefined) = plcNameText.textContent;
                                if (plcText) {
                                    plcLabel = plcText;
                                };
                            };
                        };
                        const plcGraphicsElement : (Element | undefined) = plcChildren.find(plcChild => plcChild.nodeName === "graphics");
                        if (plcGraphicsElement && plcGraphicsElement.hasChildNodes()) {
                            const plcGraphicsChildren : Element[] = Array.from(plcGraphicsElement.children);
                            const plcGraphicsPosition : (Element | undefined) = plcGraphicsChildren.find(plcGraphicsChild => plcGraphicsChild.nodeName === "position");
                            if (plcGraphicsPosition) {
                                const plcPositionX : (string | undefined) = plcGraphicsPosition.attributes.getNamedItem('x')?.value;
                                if (plcPositionX) {
                                    plcCoordsX = (Math.round(parseFloat(plcPositionX)));
                                };
                                const plcPositionY : (string | undefined) = plcGraphicsPosition.attributes.getNamedItem('y')?.value;
                                if (plcPositionY) {
                                    plcCoordsY = (Math.round(parseFloat(plcPositionY)));
                                };
                            };
                        };
                        const plcMarkingElement : (Element | undefined) = plcChildren.find(plcChild => plcChild.nodeName === "initialMarking");
                        if (plcMarkingElement && plcMarkingElement.hasChildNodes()) {
                            const plcMarkingChildren : Element[] = Array.from(plcMarkingElement.children);
                            const plcMarkingText : (Element | undefined) = plcMarkingChildren.find(plcMarkingChild => plcMarkingChild.nodeName === "text");
                            if (plcMarkingText) {
                                const plcMarking : (string | null | undefined) = plcMarkingText.textContent;
                                if (plcMarking) {
                                    plcMark = parseInt(plcMarking);
                                };
                            };
                        };
                    };
                    const addedPlace : Place = pnmlNet.addPlace(plcLabel, plcMark, plcCoordsX, plcCoordsY).obj_ref;
                    if (nodeIdMap[plcId] === undefined) {
                        nodeIdMap[plcId] = addedPlace;
                    } else {
                        if (nodeIdMap[plcId] instanceof Place) {
                            throw new Error('duplicate place id \'' + plcId + '\'');
                        } else {
                            throw new Error('duplicate node id \'' + plcId + '\'');
                        };
                    };
                };
            };
            const trsList : NodeListOf<Element> = pnmlDocument.querySelectorAll('transition');
            if (trsList.length !== 0) {
                const trsArray : Element[] = Array.from(trsList);
                for (const trsElement of trsArray) {
                    const trsId : (string | undefined) = trsElement.attributes.getNamedItem('id')?.value;
                    if (!trsId) {
                        throw new Error('transition element without id detected');
                    };
                    let trsLabel : string = '';
                    let trsCoordsX : (number | undefined);
                    let trsCoordsY : (number | undefined);
                    if (trsElement.hasChildNodes()) {
                        const trsChildren : Element[] = Array.from(trsElement.children);
                        const trsNameElement : (Element | undefined) = trsChildren.find(trsChild => trsChild.nodeName === "name");
                        if (trsNameElement && trsNameElement.hasChildNodes()) {
                            const trsNameChildren : Element[] = Array.from(trsNameElement.children);
                            const trsNameText : (Element | undefined) = trsNameChildren.find(trsNameChild => trsNameChild.nodeName === "text");
                            if (trsNameText) {
                                const trsText : (string | null | undefined) = trsNameText.textContent;
                                if (trsText) {
                                    trsLabel = trsText;
                                };
                            };
                        };
                        const trsGraphicsElement : (Element | undefined) = trsChildren.find(trsChild => trsChild.nodeName === "graphics");
                        if (trsGraphicsElement && trsGraphicsElement.hasChildNodes()) {
                            const trsGraphicsChildren : Element[] = Array.from(trsGraphicsElement.children);
                            const trsGraphicsPosition : (Element | undefined) = trsGraphicsChildren.find(trsGraphicsChild => trsGraphicsChild.nodeName === "position");
                            if (trsGraphicsPosition) {
                                const trsPositionX : (string | undefined) = trsGraphicsPosition.attributes.getNamedItem('x')?.value;
                                if (trsPositionX) {
                                    trsCoordsX = (Math.round(parseFloat(trsPositionX)));
                                };
                                const trsPositionY : (string | undefined) = trsGraphicsPosition.attributes.getNamedItem('y')?.value;
                                if (trsPositionY) {
                                    trsCoordsY = (Math.round(parseFloat(trsPositionY)));
                                };
                            };
                        };
                    };
                    const addedTransition : Transition = pnmlNet.addTransition(trsLabel, trsCoordsX, trsCoordsY).obj_ref;
                    if (nodeIdMap[trsId] === undefined) {
                        nodeIdMap[trsId] = addedTransition;
                    } else {
                        if (nodeIdMap[trsId] instanceof Transition) {
                            throw new Error('duplicate transition id \'' + trsId + '\'');
                        } else {
                            throw new Error('duplicate node id \'' + trsId + '\'');
                        };
                    };
                };
            };
            const arcList : NodeListOf<Element> = pnmlDocument.querySelectorAll('arc');
            if (arcList.length !== 0) {
                const arcArray : Element[] = Array.from(arcList);
                for (const arcElement of arcArray) {
                    const arcSourceId : (string | undefined) = arcElement.attributes.getNamedItem('source')?.value;
                    if (!arcSourceId) {
                        throw new Error('arc element without source node id detected');
                    };
                    const arcTargetId : (string | undefined) = arcElement.attributes.getNamedItem('target')?.value;
                    if (!arcTargetId) {
                        throw new Error('arc element without target node id detected');
                    };
                    const arcSource : (Place | Transition | undefined) = nodeIdMap[arcSourceId];
                    if (!arcSource) {
                        throw new Error('arc element with unknown source node id detected');
                    };
                    const arcTarget : (Place | Transition | undefined) = nodeIdMap[arcTargetId];
                    if (!arcTarget) {
                        throw new Error('arc element with unknown target node id detected');
                    };
                    let arcPlace : Place;
                    let arcTransition : Transition;
                    let placeIsSource : boolean;
                    if (arcSource instanceof Place) {
                        if (arcTarget instanceof Transition) {
                            arcPlace = arcSource;
                            arcTransition = arcTarget;
                            placeIsSource = true;
                        } else {
                            throw new Error('arc element with source place and target place detected');
                        };
                    } else {
                        if (arcTarget instanceof Place) {
                            arcPlace = arcTarget;
                            arcTransition = arcSource;
                            placeIsSource = false;
                        } else {
                            throw new Error('arc element with source transition and target transition detected');
                        };
                    };
                    let arcWeight : (number | undefined);
                    if (arcElement.hasChildNodes()) {
                        const arcChildren : Element[] = Array.from(arcElement.children);
                        const arcInscriptionElement : (Element | undefined) = arcChildren.find(arcChild => arcChild.nodeName === "inscription");
                        if (arcInscriptionElement && arcInscriptionElement.hasChildNodes()) {
                            const arcInscriptionChildren : Element[] = Array.from(arcInscriptionElement.children);
                            const arcInscriptionText : (Element | undefined) = arcInscriptionChildren.find(arcInscriptionChild => arcInscriptionChild.nodeName === "text");
                            if (arcInscriptionText) {
                                const arcInscription : (string | null | undefined) = arcInscriptionText.textContent;
                                if (arcInscription) {
                                    arcWeight = parseInt(arcInscription);
                                };
                            };
                        };
                    };
                    pnmlNet.addArc(arcPlace, arcTransition, placeIsSource, arcWeight);
                };
            };
            return (pnmlNet);
        } catch (error) {
            this.popupService.error('srv.fps.psp.000', 'failed to parse file content', 'consider checking the file content for structural errors');
            console.error('Error: #srv.fps.psp.000: ' + 'failed to parse .pnml-file', error);
            console.error('File: ', inPnmlString);
            return (new Net);
        };
    };

    private parseSAV(inSavString : string) : Net {
        try {
            const jsonSoundSave = JSON.parse(inSavString) as JsonSoundSave;
            const savNet : Net = new Net();
            const nodeIdMap : {
                [savNodeId : string] : (Transition | Place)
            } = {};
            const arcIdMap : {
                [savArcId : string] : Arc
            } = {};
            for (const place of jsonSoundSave.places) {
                let placeLabel : string;
                if (jsonSoundSave.labels[place] !== undefined) {
                    placeLabel = (jsonSoundSave.labels[place]);
                } else {
                    throw new Error('no label found for place with id \'' + place + '\'');
                };
                let placeInitialMarking : number;
                if (jsonSoundSave.marking[place] !== undefined) {
                    placeInitialMarking = jsonSoundSave.marking[place];
                } else {
                    throw new Error('no marking found for place with id \'' + place + '\'');
                };
                let placeX : (number | undefined);
                let placeY : (number | undefined);
                if (jsonSoundSave.layout[place] !== undefined) {
                    const placeCoords : Coords = (jsonSoundSave.layout[place] as Coords);
                    placeX = placeCoords.x;
                    placeY = placeCoords.y;
                } else {
                    throw new Error('no layout information found for place with id \'' + place + '\'');
                };
                let placeMarking : number;
                if (jsonSoundSave.marking_current[place] !== undefined) {
                    placeMarking = jsonSoundSave.marking_current[place];
                } else {
                    throw new Error('no current marking found for place with id \'' + place + '\'');
                };
                if (nodeIdMap[place] === undefined) {
                    const placeNode : Place = (savNet.addPlace(placeLabel, placeInitialMarking, placeX, placeY).obj_ref);
                    placeNode.marking = placeMarking;
                    nodeIdMap[place] = placeNode;
                } else {
                    if (nodeIdMap[place] instanceof Place) {
                        throw new Error('duplicate place id \'' + place + '\'');
                    } else {
                        throw new Error('duplicate node id \'' + place + '\'');
                    };
                };
            };
            for (const transition of jsonSoundSave.transitions) {
                let transitionLabel : string;
                if (jsonSoundSave.labels[transition] !== undefined) {
                    transitionLabel = (jsonSoundSave.labels[transition]);
                } else {
                    throw new Error('no label found for transition with id \'' + transition + '\'');
                };
                let transitionX : (number | undefined);
                let transitionY : (number | undefined);
                if (jsonSoundSave.layout[transition] !== undefined) {
                    const transitionCoords : Coords = (jsonSoundSave.layout[transition] as Coords);
                    transitionX = transitionCoords.x;
                    transitionY = transitionCoords.y;
                } else {
                    throw new Error('no layout information found for transition with id \'' + transition + '\'');
                };
                if (nodeIdMap[transition] === undefined) {
                    nodeIdMap[transition] = (savNet.addTransition(transitionLabel, transitionX, transitionY).obj_ref);
                } else {
                    if (nodeIdMap[transition] instanceof Transition) {
                        throw new Error('duplicate transition id \'' + transition + '\'');
                    } else {
                        throw new Error('duplicate node id \'' + transition + '\'');
                    };
                };
            };
            for (const arc in jsonSoundSave.arcs) {
                const idPair : string[] = arc.split(',');
                if (idPair.length !== 2) {
                    throw new Error('could not parse source and target node information for arc with id \'' + arc + '\': expected 2 values, but got ' + idPair.length);
                };
                const arcSource : (Place | Transition | undefined) = nodeIdMap[idPair[0]];
                if (!arcSource) {
                    throw new Error('could not parse source node for arc with id \'' + arc + '\': unknown node id');
                };
                const arcTarget : (Place | Transition | undefined) = nodeIdMap[idPair[1]];
                if (!arcTarget) {
                    throw new Error('could not parse target node for arc with id \'' + arc + '\': unknown node id');
                };
                let arcPlace : Place;
                let arcTransition : Transition;
                let placeIsSource : boolean;
                if (arcSource instanceof Place) {
                    if (arcTarget instanceof Transition) {
                        arcPlace = arcSource;
                        arcTransition = arcTarget;
                        placeIsSource = true;
                    } else {
                        throw new Error('could not parse arc with id \'' + arc + '\': source and target node are both places');
                    };
                } else {
                    if (arcTarget instanceof Place) {
                        arcPlace = arcTarget;
                        arcTransition = arcSource;
                        placeIsSource = false;
                    } else {
                        throw new Error('could not parse arc with id \'' + arc + '\': source and target node are both transitions');
                    };
                };
                if (jsonSoundSave.layout[arc] === undefined) {
                    throw new Error('no layout information found for arc with id \'' + arc + '\'');
                };
                arcIdMap[arc] = (savNet.addArc(arcPlace, arcTransition, placeIsSource, jsonSoundSave.arcs[arc]).obj_ref);
            };
            for (const elemId in jsonSoundSave.flag_marked) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.markedArcs.push(elem);
                        elem.marked = true;
                    } else {
                        throw new Error('could not parse marked flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.markedPlaces.push(elem);
                            elem.marked = true;
                        } else {
                            savNet.markedTransitions.push(elem);
                            elem.marked = true;
                        };
                    } else {
                        throw new Error('could not parse marked flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            for (const elemId in jsonSoundSave.flag_visited.log) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.seqLogArcs.push(elem);
                        elem.inSequenceLog = true;
                    } else {
                        throw new Error('could not parse seqLog flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.seqLogPlaces.push(elem);
                            elem.inSequenceLog = true;
                        } else {
                            savNet.seqLogTransitions.push(elem);
                            elem.inSequenceLog = true;
                        };
                    } else {
                        throw new Error('could not parse seqLog flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            for (const elemId in jsonSoundSave.flag_visited.past) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.seqPastArcs.push(elem);
                        elem.inSequencePast = true;
                    } else {
                        throw new Error('could not parse seqPast flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.seqPastPlaces.push(elem);
                            elem.inSequencePast = true;
                        } else {
                            savNet.seqPastTransitions.push(elem);
                            elem.inSequencePast = true;
                        };
                    } else {
                        throw new Error('could not parse seqPast flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            for (const elemId in jsonSoundSave.flag_visited.next) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.seqNextArcs.push(elem);
                        elem.inSequenceNext = true;
                    } else {
                        throw new Error('could not parse seqNext flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.seqNextPlaces.push(elem);
                            elem.inSequenceNext = true;
                        } else {
                            savNet.seqNextTransitions.push(elem);
                            elem.inSequenceNext = true;
                        };
                    } else {
                        throw new Error('could not parse seqNext flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            for (const elemId in jsonSoundSave.flag_error.one) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.errLvl1Arcs.push(elem);
                        elem.errorLevel1 = true;
                    } else {
                        throw new Error('could not parse errLvl1 flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.errLvl1Places.push(elem);
                            elem.errorLevel1 = true;
                        } else {
                            savNet.errLvl1Transitions.push(elem);
                            elem.errorLevel1 = true;
                        };
                    } else {
                        throw new Error('could not parse errLvl1 flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            for (const elemId in jsonSoundSave.flag_error.two) {
                if (elemId.includes(',')) {
                    const elem : (Arc | undefined) = arcIdMap[elemId];
                    if (elem) {
                        savNet.errLvl2Arcs.push(elem);
                        elem.errorLevel2 = true;
                    } else {
                        throw new Error('could not parse errLvl2 flag for element with id \'' + elemId + '\': element id is not a known arc id');
                    };
                } else {
                    const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                    if (elem) {
                        if (elem instanceof Place) {
                            savNet.errLvl2Places.push(elem);
                            elem.errorLevel2 = true;
                        } else {
                            savNet.errLvl2Transitions.push(elem);
                            elem.errorLevel2 = true;
                        };
                    } else {
                        throw new Error('could not parse errLvl2 flag for element with id \'' + elemId + '\': element id is not a known node id');
                    };
                };
            };
            if (savNet.empty !== jsonSoundSave.net_empty) {
                throw new Error('net empty status (' + savNet.empty + ') does not match savefile empty status (' + jsonSoundSave.net_empty + ')');
            };
            savNet.workflow = jsonSoundSave.net_workflow;
            savNet.unsavedSequence = jsonSoundSave.sequence_unsaved;
            savNet.nextSequenceEntry = jsonSoundSave.sequence_next;
            let actIdx : number = 0;
            for (const actEntry of jsonSoundSave.sequence_active) {
                actIdx++;
                const fired : (Place | Transition | undefined) = nodeIdMap[actEntry.fired];
                if (fired) {
                    if (fired instanceof Place) {
                        throw new Error('could not parse active sequence entry \'' + actIdx + '\': fired transition id \'' + fired + '\' is a place id');
                    };
                } else {
                    throw new Error('could not parse active sequence entry \'' + actIdx + '\': fired transition id \'' + fired + '\' is not a known node id');
                };
                const added : (Transition | Place | Arc)[] = [];
                for (const elemId of actEntry.added) {
                    if (elemId.includes(',')) {
                        const elem : (Arc | undefined) = arcIdMap[elemId];
                        if (elem) {
                            added.push(elem);
                        } else {
                            throw new Error('could not parse active sequence entry \'' + actIdx + '\': added element id \'' + elemId + '\' is not a known arc id');
                        };
                    } else {
                        const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                        if (elem) {
                            added.push(elem);
                        } else {
                            throw new Error('could not parse active sequence entry \'' + actIdx + '\': added element id \'' + elemId + '\' is not a known node id');
                        };
                    };
                };
                savNet.activeSequence.push({
                    firedTransition : (fired),
                    addedToSequence : (added),
                    markingValidity : (actEntry.valid)
                });
            };
            let logIdx : number = 0;
            for (const logEntry of jsonSoundSave.sequence_log) {
                logIdx++;
                if (logEntry.length > 0) {
                    let seqIdx : number = 0;
                    const netLogEntry : {
                        firedTransition : Transition,
                        addedToSequence : (Transition | Place | Arc)[],
                        markingValidity : boolean
                    }[] = []
                    for (const seqEntry of logEntry) {
                        seqIdx++;
                        const fired : (Place | Transition | undefined) = nodeIdMap[seqEntry.fired];
                        if (fired) {
                            if (fired instanceof Place) {
                                throw new Error('could not parse log sequence \'' + logIdx + '\', entry \'' + actIdx + '\': fired transition id \'' + fired + '\' is a place id');
                            };
                        } else {
                            throw new Error('could not parse log sequence \'' + logIdx + '\', entry \'' + actIdx + '\': fired transition id \'' + fired + '\' is not a known node id');
                        };
                        const added : (Transition | Place | Arc)[] = [];
                        for (const elemId of seqEntry.added) {
                            if (elemId.includes(',')) {
                                const elem : (Arc | undefined) = arcIdMap[elemId];
                                if (elem) {
                                    added.push(elem);
                                } else {
                                    throw new Error('could not parse log sequence \'' + logIdx + '\', entry \'' + actIdx + '\': added element id \'' + elemId + '\' is not a known arc id');
                                };
                            } else {
                                const elem : (Place | Transition | undefined) = nodeIdMap[elemId];
                                if (elem) {
                                    added.push(elem);
                                } else {
                                    throw new Error('could not parse log sequence \'' + logIdx + '\', entry \'' + actIdx + '\': added element id \'' + elemId + '\' is not a known node id');
                                };
                            };
                        };
                        netLogEntry.push({
                            firedTransition : (fired),
                            addedToSequence : (added),
                            markingValidity : (seqEntry.valid)
                        });
                    };
                    savNet.appendLogEntry(netLogEntry);
                } else {
                    throw new Error('could not parse log sequence \'' + logIdx + '\': sequence has length \'' + logEntry.length + '\'');
                };
            };
            if (jsonSoundSave.sequences_completed) {
                savNet.completedSequences = jsonSoundSave.sequences_completed;
            } else {
                throw new Error('could not parse number of completed sequences: field is undefined in sav');
            };
            if (jsonSoundSave.errors) {
                savNet.errors = jsonSoundSave.errors;
            } else {
                throw new Error('could not parse errors: field is undefined in sav');
            };
            return (savNet);
        } catch (error) {
            this.popupService.error('srv.fps.pss.000', 'failed to parse file content', 'consider checking the file content for structural errors');
            console.error('Error: #srv.fps.pss.000: ' + 'failed to parse .sav-file', error);
            console.error('File: ', inSavString);
            return (new Net);
        };
    };

    private parseTXT(inTxtString : string) : Net {
        try {
            const lines : string[] = inTxtString.split('\n');
            for (let l = 0; l < lines.length; l++) {
                lines[l] = lines[l].trim();
            };
            let emptyLine : number = lines.indexOf('');
            while (emptyLine > (-1)) {
                lines.splice(emptyLine, 1);
                emptyLine = lines.lastIndexOf('');
            };
            if (lines[0] !== '.type pn') {
                throw new Error('declaration \'.type pn\' expected in line 1');
            };
            const txtNet : Net = new Net();
            let nodeIdCheck : {
                [txtNodeId : string] : ('place' | 'transition')
            } = {};
            const transitions : [id : string, label : string][] = [];
            const places : [label : string, marking : number][] = [];
            const arcs : [source : string, target : string, weight : number, line : number][] = [];
            let transitionsFinished : boolean = false;
            let placesFinished : boolean = false;
            let arcsFinished : boolean = false;
            let line : number = 1;
            while (line < lines.length) {
                switch (lines[line]) {
                    case '.transitions' : {
                        if (transitionsFinished) {
                            throw new Error('invalid \'.transitions\' declaration found in line ' + (line + 1) + ': a transitions block may only be declared once');
                        };
                        line++;
                        while ((line < lines.length) && (lines[line] !== '.transitions') && (lines[line] !== '.places') && (lines[line] !== '.arcs')) {
                            const trsArray = lines[line].split(' ');
                            if (trsArray.length === 1) {
                                if (nodeIdCheck[trsArray[0]] === undefined) {
                                    transitions.push([trsArray[0], '']);
                                } else if (nodeIdCheck[trsArray[0]] === 'transition') {
                                    throw new Error('invalid transition definition found in line ' + (line + 1) + ': duplicate transition id detected');
                                } else {
                                    throw new Error('invalid transition definition found in line ' + (line + 1) + ': duplicate node id detected');
                                };
                            } else if (trsArray.length === 2) {
                                if (nodeIdCheck[trsArray[0]] === undefined) {
                                    transitions.push([trsArray[0], trsArray[1]]);
                                } else if (nodeIdCheck[trsArray[0]] === 'transition') {
                                    throw new Error('invalid transition definition found in line ' + (line + 1) + ': duplicate transition id detected');
                                } else {
                                    throw new Error('invalid transition definition found in line ' + (line + 1) + ': duplicate node id detected');
                                };
                            } else {
                                throw new Error('invalid transition definition found in line ' + (line + 1) + ': a transition definition must adhere to the format \'<id>\' or \'<id> <label>\'');
                            };
                            line++;
                        };
                        transitionsFinished = true;
                        break;
                    }
                    case '.places' : {
                        if (placesFinished) {
                            throw new Error('invalid \'.places\' declaration found in line ' + (line + 1) + ': a places block may only be declared once');
                        };
                        line++;
                        while ((line < lines.length) && (lines[line] !== '.transitions') && (lines[line] !== '.places') && (lines[line] !== '.arcs')) {
                            const plcArray = lines[line].split(' ');
                            if (plcArray.length === 2) {
                                if (nodeIdCheck[plcArray[0]] === undefined) {
                                    places.push([plcArray[0], parseInt(plcArray[1])]);
                                } else if (nodeIdCheck[plcArray[0]] === 'place') {
                                    throw new Error('invalid place definition found in line ' + (line + 1) + ': duplicate place id detected');
                                } else {
                                    throw new Error('invalid place definition found in line ' + (line + 1) + ': duplicate node id detected');
                                };
                            } else {
                                throw new Error('invalid place definition found in line ' + (line + 1) + ': a place definition must adhere to the format \'<id> <marking>\'');
                            };
                            line++;
                        };
                        placesFinished = true;
                        break;
                    }
                    case '.arcs' : {
                        if (arcsFinished) {
                            throw new Error('invalid \'.arcs\' declaration found in line ' + (line + 1) + ': an arcs block may only be declared once');
                        };
                        line++;
                        while ((line < lines.length) && (lines[line] !== '.transitions') && (lines[line] !== '.places') && (lines[line] !== '.arcs')) {
                            const arcArray = lines[line].split(' ');
                            if (arcArray.length === 2) {
                                arcs.push([arcArray[0], arcArray[1], 1, line]);
                            } else if (arcArray.length === 3) {
                                arcs.push([arcArray[0], arcArray[1], parseInt(arcArray[2]), line]);
                            } else {
                                throw new Error('invalid arc definition found in line ' + (line + 1) + ': an arc definition must adhere to the format \'<source_id> <target_id>\' or \'<source_id> <target_id> <weight>\'');
                            };
                            line++;
                        };
                        arcsFinished = true;
                        break;
                    }
                    default : {
                        throw new Error('declaration \'.transitions\', \'.places\' or \'.arcs\' expected in line ' + (line + 1));
                    }
                };
            };
            let nodeIdMap : {
                [txtNodeId : string] : (Place | Transition)
            } = {};
            for (const place of places) {
                nodeIdMap[place[0]] = txtNet.addPlace(place[0], place[1], undefined, undefined).obj_ref;
            };
            for (const transition of transitions) {
                nodeIdMap[transition[0]] = txtNet.addTransition(transition[1], undefined, undefined).obj_ref;
            };
            for (const arc of arcs) {
                const arcSource : (Place | Transition | undefined) = nodeIdMap[arc[0]];
                if (!arcSource) {
                    throw new Error('invalid arc definition found in line ' + arc[3] + ': unknown source node id');
                };
                const arcTarget : (Place | Transition | undefined) = nodeIdMap[arc[1]];
                if (!arcTarget) {
                    throw new Error('invalid arc definition found in line ' + arc[3] + ': unknown target node id');
                };
                let arcPlace : Place;
                let arcTransition : Transition;
                let placeIsSource : boolean;
                if (arcSource instanceof Place) {
                    if (arcTarget instanceof Transition) {
                        arcPlace = arcSource;
                        arcTransition = arcTarget;
                        placeIsSource = true;
                    } else {
                        throw new Error('invalid arc definition found in line ' + arc[3] + ': source and target are both places');
                    };
                } else {
                    if (arcTarget instanceof Place) {
                        arcPlace = arcTarget;
                        arcTransition = arcSource;
                        placeIsSource = false;
                    } else {
                        throw new Error('invalid arc definition found in line ' + arc[3] + ': source and target are both transitions');
                    };
                };
                txtNet.addArc(arcPlace, arcTransition, placeIsSource, arc[2]);
            };
            return (txtNet);
        } catch (error) {
            this.popupService.error('srv.fps.pst.000', 'failed to parse file content', 'consider checking the file content for structural errors');
            console.error('Error: #srv.fps.pst.000: ' + 'failed to parse .txt-file', error);
            console.error('File: ', inTxtString);
            return (new Net);
        };
    };

};