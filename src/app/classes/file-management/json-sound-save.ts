import {Coords} from './coordinates';

export interface JsonSoundSave {

    places : string[],

    transitions : string[],

    arcs : {
        [nodeIdPair : string] : number
    },

    layout : {
        [elemId : string] : (Coords | Coords[])
    },

    labels : {
        [nodeId : string] : string
    },

    marking : {
        [placeId : string]: number
    },

    marking_current : {
        [placeId : string]: number
    },

    flag_marked : {
        [elemId : string] : boolean
    },

    flag_visited : {
        log : {
            [elemId : string] : boolean
        },
        past : {
            [elemId : string] : boolean
        },
        next : {
            [elemId : string] : boolean
        }
    },

    flag_error : {
        one : {
            [elemId : string] : boolean
        },
        two : {
            [elemId : string] : boolean
        }
    },

    net_empty : boolean,

    net_workflow : boolean,

    sequence_unsaved : boolean,

    sequence_next : number,

    sequence_active : {
        fired : string,
        added : string[],
        valid : boolean
    }[],

    sequence_log : {
        fired : string,
        added : string[],
        valid : boolean
    }[][],

    sequences_completed : number,

    errors : {
        nSeq : number,
        iSeq : number,
        dTrs : number
    }

}