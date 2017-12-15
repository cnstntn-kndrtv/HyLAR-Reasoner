/**
 * Created by Spadon on 13/11/2015.
 */

/**
 * Dictionary used to index triples (in turtle) and their fact representation.
 * @type {{substractFactSets: Function, combine: Function}|exports|module.exports}
 */

var Utils = require('./Utils');
var ParsingInterface = require('./ParsingInterface');

function Dictionary() {
    this.dict = {
        '#default': {}
    };
    this.lastUpdate = 0;
    this.purgeThreshold = 13000000;
};

Dictionary.prototype.turnOnForgetting = function() {
    this.allowPurge = true;
};

Dictionary.prototype.turnOffForgetting = function() {
    this.allowPurge = false;
};

Dictionary.prototype.resolveGraph = function(graph) {
    if (!graph) {
        return "#default";
    } else if (!this.dict[graph]) {
        this.dict[graph] = {};
    }
    return graph;
};

Dictionary.prototype.clear = function() {
    this.dict = {
        '#default': {}
    };
};

/**
 * Retrieves statistics of the KB with
 * - the fact with the largest 'derivedFrom' tag
 * - the total number of derivedFromTags
 */
Dictionary.prototype.getDictionaryStatistics = function() {
    var size = 0,
        totalSize = 0,
        totalConjSize = 0,
        largestF = null;
    for (var graph in this.dict) {
        for (var factStr in this.dict[graph]) {
            var factExplicitImplicit = this.dict[graph][factStr];
            for (var i = 0; i < factExplicitImplicit.length; i ++) {
                var fact = factExplicitImplicit[i];
                if (fact && fact.causedBy !== undefined) {
                    var tmpSize = 0;
                    for (var j = 0; j < fact.causedBy.length; j++) {
                        tmpSize += fact.causedBy[j].length;
                    }
                    if (tmpSize > size) {
                        size = tmpSize;
                        largestF = fact;
                    }
                    totalConjSize += fact.causedBy.length;
                    totalSize += tmpSize;
                }
            }
        }
    }
    return {
        'total_cause_conjunction_size': totalConjSize,
        'total_size': totalSize,
        'largest_fact_df': {
            'fact': largestF,
            'df_size': size
        }
    };
};

/**
 * Returns the fact corresponding to the turtle triple.
 * @param ttl
 * @returns {*}
 */
Dictionary.prototype.get = function(ttl, graph) {
    var facts;
    graph = this.resolveGraph(graph);
    facts = this.dict[graph][ttl];
    if (facts !== undefined) {
        return facts;
    }
    else return false;
};

/**
 * Updates the fact representation of
 * an existing turtle triple, or puts
 * a new one by transform the fact into turtle
 * through the ParsingInterface.
 * @param fact
 * @returns {*}
 */
Dictionary.prototype.put = function(fact, strFact, graph) {
    var timestamp = new Date().getTime(), factToTurtle;

    if (this.allowPurge) {
        this.purgeOld();
    }

    this.lastUpdate = timestamp;
    graph = this.resolveGraph(graph);

    try {
        if(fact.predicate === 'FALSE') {
            this.dict[graph]['__FALSE__'] = [fact];
        } else {
            factToTurtle = strFact;
            if (this.dict[graph][factToTurtle]) {
                this.dict[graph][factToTurtle] = Utils.insertUnique(this.dict[graph][factToTurtle], fact);
            } else {
                this.dict[graph][factToTurtle] = [fact];
                this.dict[graph][factToTurtle].lastUpdate = timestamp;
            }
        }
        return true;
    } catch(e) {
        return e;
    }
};

Dictionary.prototype.isOld = function(graph, factIndex) {
    return (this.dict[graph][factIndex].lastUpdate - this.lastUpdate) > this.purgeThreshold;
};

Dictionary.prototype.purgeOld = function() {
    for (var i in this.dict.length) {
        for (var j in this.dict[i].length) {
            for (var k in this.dict[i][j]) {
                if (!this.dict[i][j][k].isValid() && this.isOld(i,j)) {
                    delete this.dict[i][j][k];
                }
            }
        }
    }
};

/**
 * Return the full content of the dictionary.
 * @returns {Object}
 */
Dictionary.prototype.content = function() {
    return this.dict;
};

/**
 * Sets dictionary's content.
 * @param content Object
 */
Dictionary.prototype.setContent = function(content) {
    this.dict = content;
};

/**
 * Gets all facts from the dictionary.
 * @returns {Array}
 */
Dictionary.prototype.values = function(graph) {
    var values = [];
    graph = this.resolveGraph(graph);
    for (var key in this.dict[graph]) {
        for (var i = 0; i < this.dict[graph][key].length; i++) {
            values.push(this.dict[graph][key][i]);
        }
    }
    return values;
};

/**
 * Gets facts corresponding to the turtle triples,returns an object
 * {found: facts found, notfound: turtle triples with no repr.}
 * @param triples An array of turtle triples.
 * @returns {{found: Array, notfound: Array}}
 */
Dictionary.prototype.findValues = function(triples, graph) {
    var values = [], notfound = [],
        facts;
    graph = this.resolveGraph(graph);
    for (var i = 0; i < triples.length; i++) {
        facts = this.dict[graph][triples[i].toString().slice(0, -2)];
        if(facts !== undefined) {
            for (var j = 0; j < facts.length; j++) {
                values.push(facts[j]);
            }
        } else {
           notfound.push(triples[i]);
        }
    }
    return {
        found: values,
        notfound: notfound
    };
};

/**
 * Gets turtle triples corresponding to the facts,returns an object
 * {found: triples found, notfound: facts repr. nothing.}
 * @param values
 * @returns {{found: Array, notfound: Array}}
 */
Dictionary.prototype.findKeys = function(values, graph) {
    var keys = [], value, notfound = [];
    graph = this.resolveGraph(graph);
    for (var i = 0; i< values.length; i++) {
        value = values[i];
        for (var key in this.dict[graph]) {
            try {
                if (this.dict[graph][key].toString().indexOf(value.toString()) !== -1) {
                    keys.push(key);
                    break;
                } else {
                    notfound.push(value);
                }
            } catch(e) {
                throw e;
            }
        }
    }
    return {
        found: keys,
        notfound: notfound
    };
};

/** todo gerer graphs **/
Dictionary.prototype.getFactFromStringRepresentation = function(factStr, graph) {
    graph = this.resolveGraph(graph);
    for (var key in this.dict[graph]) {
        for (var i = 0; i < this.dict[graph][key].length; i++) {
            if (this.dict[graph][key][i].toString() == factStr) {
                return {
                    key: key,
                    value: this.dict[graph][key][i],
                    graph: graph
                };
            }
        }
    }
    return false;
};

module.exports = Dictionary;