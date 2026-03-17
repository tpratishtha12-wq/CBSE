// api/resources.js
// Vercel serverless function
// Scans resources-data/<Subject>/<ResourceType>/text and returns JSON

const fs   = require('fs');
const path = require('path');

// Maps folder names to resource type keys used in the UI
const TYPE_MAP = {
  'notes':      'notes',
  'note':       'notes',
  'formulae':   'formulae',
  'formula':    'formulae',
  'formulas':   'formulae',
  'formula sheets': 'formulae',
  'pyqs':       'pyqs',
  'pyq':        'pyqs',
  'past year':  'pyqs',
  'numericals': 'numericals',
  'numerical':  'numericals',
  'videos':     'videos',
  'video':      'videos',
  'video links':'videos',
  'diagrams':   'diagrams',
  'diagram':    'diagrams',
  'derivations':'diagrams',
};

function normaliseType(folderName) {
  var lower = folderName.toLowerCase().trim();
  return TYPE_MAP[lower] || lower;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    var root = path.join(process.cwd(), 'resources-data');
    if (!fs.existsSync(root)) return res.status(200).json({});

    var result = {};

    fs.readdirSync(root).forEach(function(subject) {
      var subjectPath = path.join(root, subject);
      if (!fs.statSync(subjectPath).isDirectory()) return;

      result[subject] = {};

      fs.readdirSync(subjectPath).forEach(function(typeFolder) {
        var typePath = path.join(subjectPath, typeFolder);
        if (!fs.statSync(typePath).isDirectory()) return;

        var textFile = path.join(typePath, 'text');
        if (!fs.existsSync(textFile)) return;

        var key     = normaliseType(typeFolder);
        var entries = [];

        fs.readFileSync(textFile, 'utf8').split('\n').forEach(function(line) {
          line = line.trim();
          if (!line) return;
          var idx = line.indexOf('|');
          if (idx < 0) return;
          var title = line.slice(0, idx).trim();
          var link  = line.slice(idx + 1).trim();
          if (title && link) entries.push({ title: title, link: link });
        });

        if (!result[subject][key]) result[subject][key] = [];
        result[subject][key] = result[subject][key].concat(entries);
      });
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
