/**
 * Created by Spadon on 19/08/2015.
 */

var should = require('should');
var fs = require('fs');
var path = require('path');
var mime = require('mime-types');

var OWL2RL = require('../hylar/core/OWL2RL')
var Logics = require('../hylar/core/Logics/Logics');
var H = require('../hylar/hylar');
var queries = require('./query-examples');
var owl, ontology, mimeType, Hylar = new H();

var a, b;

var reasoningMethod = process.env.rm, ontologyFilename = '/ontologies/fipa.ttl';

var clres = function(t) {
    var tclean = [];
    for (var iel in t) {
        var el = t[iel];
        if(!(el['?c'].termType == "Graph")) {
            // noinspection JSAnnotator
            /*el.__proto__.toString = function() {
                return '<'+el['?a'].value + '> <' + el['?b'].value + '> <' + el['?c'].value + '> . ';
            }*/
            tclean.push(el);
        }
    }
    return tclean;
};

//Hylar.setTagBased();

describe('File access', function () {
    it('should access the file', function () {
        var exists = fs.existsSync(path.resolve(__dirname + ontologyFilename));
        exists.should.equal(true);
    });
});

describe('File reading', function () {
    it('should correctly read the file', function () {
        var data = fs.readFileSync(path.resolve(__dirname + ontologyFilename)),
            extension = path.extname(path.resolve(__dirname + ontologyFilename));

        mimeType = mime.contentType(extension);
        if(mimeType) {
            mimeType = mimeType.replace(/;.*/g, '');
        }
        data.should.exist;
        owl = data.toString().replace(/(&)([a-z0-9]+)(;)/gi, '$2:');
    });
});

describe('Ontology Parsing and classification', function () {
    it('should parse and classify the ontology', function () {

        console.notify('\nSTARTING TESTS -----------------------------------------\n')
        console.notify('File: ' + ontologyFilename);

        return Hylar.load(owl, mimeType, false, false, reasoningMethod)
        .then(function() {
            return Hylar.query(
                'CONSTRUCT { ?a ?b ?c . } WHERE { ?a ?b ?c . }');
        })
        .then(function(r) {
            before = clres(r);
            b=clres(r);
            clres(r).length.should.be.above(0);
        });
    });
});


describe('INSERT query with derivations', function () {
    var query, results;
    it('insert data and derivations', function () {
        var queryText = queries.fipaInsert;
        return Hylar.query(queryText)
            .then(function(i) {
                i.should.be.true;
                return Hylar.query(
                    'CONSTRUCT { ?a ?b ?c . } WHERE { ?a ?b ?c . }');
            })
            .then(function(r) {
                r.length.should.be.above(before.length);
                bIns = clres(r);
            });

    });
});

describe('SELECT query with derivations', function () {
    var query, results;
    it('should find at least a class assertion', function () {
        // ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Device . } ')
            .then(function(r) {
                r.length.should.be.above(0);
            });
    });

    it('should find another class assertion', function () {
        // Multiple ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:ConnectionDescription . } ')
            .then(function(r) {
                r.length.should.equal(4);
            });
    });

    it('should find an objectProperty assertion', function () {
        // ObjectProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a fipa:hasConnection fipa:Wifi . } ')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find a dataProperty assertion', function () {
        // DataProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { fipa:Inspiron fipa:hasName ?a . } ')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find at least two subsumed class assertions', function () {
        // Subsumption test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Function . } ')
            .then(function(r) {
                if (ontologyFilename == '/ontologies/fipa.ttl') {
                    r.length.should.be.above(1);
                }
            });
    });

});

describe('DELETE query with subsumption', function () {
    var query;
    it('should delete including derivations', function () {
        var queryText = queries.fipaDelete;
        return Hylar.query(queryText)
            .then(function(i) {
                i.should.be.true;
                return Hylar.query(
                    'CONSTRUCT { ?a ?b ?c . } WHERE { ?a ?b ?c . }');
            })
            .then(function(r) {
                var diff = [];
                r = clres(r);
                for (var k in r) {
                    if (before[k] === undefined) {
                        diff.push(r[k]);
                    }
                }
                clres(r).length.should.be.exactly(before.length);
            });
    });
});

describe('DELETIONS checking', function () {
    var query, results;
    it('should find nothing', function () {
        // ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * WHERE { ?a rdf:type fipa:Device . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // Multiple ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:ConnectionDescription . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // ObjectProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a fipa:hasConnection fipa:Wifi . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // DataProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { fipa:Inspiron fipa:hasName ?a . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // Subsumption test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT ?a { ?a rdf:type fipa:Function . }')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

});

describe('Re-INSERT exact same query', function () {
    var query;
    it('should not change anything (insert)', function () {
        var queryText = queries.fipaInsert;
        return Hylar.query(queryText)
            .then(function(i) {
                i.should.be.true;
                return Hylar.query(
                    'CONSTRUCT { ?a ?b ?c . } WHERE { ?a ?b ?c . }');
            })
            .then(function(r) {
                clres(r).length.should.be.exactly(bIns.length);
            });
    });
});

describe('SELECT query with derivations', function () {
    var query, results;
    it('should find at least a class assertion', function () {
        // ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Device . } ')
            .then(function(r) {
                r.length.should.be.above(0);
            });
    });

    it('should find another class assertion', function () {
        // Multiple ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:ConnectionDescription . } ')
            .then(function(r) {
                r.length.should.equal(4);
            });
    });

    it('should find an objectProperty assertion', function () {
        // ObjectProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a fipa:hasConnection fipa:Wifi . }')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find a dataProperty assertion', function () {
        // DataProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { fipa:Inspiron fipa:hasName ?a } ')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find at least two subsumed class assertions', function () {
        // Subsumption test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Function . } ')
            .then(function(r) {
                if (ontologyFilename == '/ontologies/fipa.ttl') {
                    r.length.should.be.above(1);
                }
            });
    });

});

describe('DELETE query with subsumption', function () {
    var query;
    it('should delete including derivations', function () {
        var queryText = queries.fipaDelete;
        return Hylar.query(queryText)
            .then(function(i) {
                i.should.be.true;
                return Hylar.query(
                    'CONSTRUCT { ?a ?b ?c } WHERE { ?a ?b ?c }');
            })
            .then(function(r) {
                clres(r).length.should.be.exactly(before.length);
            });
    });
});

describe('DELETIONS checking', function () {
    var query, results;
    it('should find nothing', function () {
        // ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * WHERE { ?a rdf:type fipa:Device . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // Multiple ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:ConnectionDescription . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // ObjectProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a fipa:hasConnection fipa:Wifi . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // DataProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { fipa:Inspiron fipa:hasName ?a . } ')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

    it('should find nothing', function () {
        // Subsumption test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT ?a { ?a rdf:type fipa:Function . }')
            .then(function(r) {
                r.length.should.equal(0);
            });
    });

});

describe('Re-INSERT exact same query', function () {
    var query;
    it('should not change anything (insert)', function () {
        var queryText = queries.fipaInsert;
        return Hylar.query(queryText)
            .then(function(i) {
                i.should.be.true;
                return Hylar.query(
                    'CONSTRUCT { ?a ?b ?c } WHERE { ?a ?b ?c }');
            })
            .then(function(r) {
                clres(r).length.should.be.exactly(bIns.length);
            });
    });
});

describe('SELECT query with derivations', function () {
    var query, results;
    it('should find at least a class assertion', function () {
        // ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Device . } ')
            .then(function(r) {
                r.length.should.be.above(0);
            });
    });

    it('should find another class assertion', function () {
        // Multiple ClassAssertion Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:ConnectionDescription . } ')
            .then(function(r) {
                r.length.should.equal(4);
            });
    });

    it('should find an objectProperty assertion', function () {
        // ObjectProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a fipa:hasConnection fipa:Wifi . }')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find a dataProperty assertion', function () {
        // DataProperty Test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { fipa:Inspiron fipa:hasName ?a } ')
            .then(function(r) {
                r.length.should.equal(1);
            });
    });

    it('should find at least two subsumed class assertions', function () {
        // Subsumption test
        return Hylar.query(
                'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> ' +
                'PREFIX fipa: <http://sites.google.com/site/smartappliancesproject/ontologies/fipa#> ' +
                'SELECT * { ?a rdf:type fipa:Function . } ')
            .then(function(r) {
                if (ontologyFilename == '/ontologies/fipa.ttl') {
                    r.length.should.be.above(1);
                }
            });
    });

});
