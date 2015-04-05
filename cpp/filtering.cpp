/* filtering algorithm cpp file
 *
 * author: Sasha Heinen
 * Nov 12 2014
 */

#include <stdlib.h>
#include <stdio.h>
#include <algorithm>
#include <sstream>

#include "filtering.h"

using namespace std;

std::vector<std::string> &split(const std::string &s, char delim, std::vector<std::string> &elems) {
    std::stringstream ss(s);
    std::string item;
    while (std::getline(ss, item, delim)) {
        elems.push_back(item);
    }
    return elems;
}

Filter::Filter(const char * fileName)
	:_inputFile(fileName), _fileName(fileName)
{

}

void Filter::runFiltering(int numberOfFilters, int interestingNumber)
{
	_numberOfFilters = numberOfFilters;
	_interestingNumber = interestingNumber;

	if (_inputFile.is_open()) {
		fprintf(stdout, "Opened file successfully\n");
		buildDB();
	} else {
		fprintf(stderr, "Filename error\n");
	}
}

void Filter::buildDB()
{
	std::string line;
	size_t hashedValue = 0;

	cout << "Building database" << endl;

	// strip all the crap from the beginning of the file
	getline(_inputFile, line);
	while (line.find("Count") != std::string::npos) {
		getline(_inputFile, line);
	}

	_header = line;

	getline(_inputFile, line);

	cout << "initial structure is " << _header << endl;
	_initialStructure = line;

	// Line number addition
	fstream tempFile;

	std::string tempFileName = _fileName;
	tempFileName.erase(tempFileName.size()-4,string::npos).append("numbers");

	tempFile.open(tempFileName, fstream::out); 

	tempFile << _header << endl;
	tempFile << _initialStructure << endl;

	int currentLine = 0;

	while (getline(_inputFile, line)) {

		tempFile << line << ", " << to_string(currentLine) << endl;
		++currentLine;

		std::vector<std::string> parsedStrand;

		split(line, ',', parsedStrand);

		std::vector<std::string> energyStatement;
		split(parsedStrand[2], ' ', energyStatement);

		string strandStructure = parsedStrand[0];

		float energy;
		if (energyStatement.size() == 4)
			energy = stof(energyStatement[2]);
		else
			energy = stof(energyStatement[3]);

		Structure strandObject = Structure(strandStructure, energy);

		hashedValue = str_hash(parsedStrand[0]);

		it = _db.find(hashedValue);

		if (it == _db.end()) {
			// key is not in the database
			_db.insert(make_pair(hashedValue, make_pair(strandObject, 1)));

		} else {
			// key is in the database
			it->second.second++;
		}

	}

	cout << "Finished building database" << endl;
	cout << "File contains " << to_string(_db.size()) << " unique structures." << endl;

	filter();
}

void Filter::filter()
{
	cout << "Filtering..." << endl;

	vector<Structure> structuresList; 
	mostVisitedStructures(structuresList);

	ifstream inputFile;
	fstream tempFile;
	string inFileName;
	string tmpName;

	// Maintain count of how many structures we've filtered to facilitate logic around tempfile lifecycle
	int i = 0;

	while (structuresList.size() > 0) {

		//////////////////////////////// FILE MANAGEMENT //////////////////////////////////
		if (i==0) {
			inFileName = _fileName;
			inFileName.erase(inFileName.size()-4,string::npos).append("numbers");
		} else {
			inFileName = "tempFile" + to_string(i-1);
		}

		// if there is only one structure left in the most visited structures list, there
		// cannot be any left after filtering it.
		if (structuresList.size() == 1) {
			string finalPrefix = "remove_loops_";
			tmpName = finalPrefix.append(_fileName);
		} else
			tmpName = "tempFile" + to_string(i);

		inputFile.open(inFileName, fstream::in);
		tempFile.open(tmpName, fstream::out);

		///////////////////////////////// STRUCTURE LOGIC /////////////////////////////////////

		string mostVisited = structuresList.at(0).structure;

		cout << "Filtering for " << mostVisited << endl;
		it = _db.find(str_hash(mostVisited));
		cout << "Visited " << to_string(it->second.second) << " times" << endl;

		if (inputFile.is_open() && tempFile.is_open()) 
		{
			std::string line;

			///////// HEADER MANAGEMENT ////////
			getline(inputFile, line);

			// write nucleotide sequence to tempfile
			tempFile << line << endl;

			// strip initial structure header
			getline(inputFile, line);

			// write initial structure header to tempfile
			tempFile << line << endl;

			///////// FILTERING ///////////
			vector<pair<string, int>> loop;

			while (getline(inputFile, line))
			{

				std::vector<std::string> parsedStrand;
				split(line, ',', parsedStrand);	
				string strandStructure = parsedStrand[0];
				int originalLineNumber;
				(i==0) ? originalLineNumber = stoi(parsedStrand[3]) : originalLineNumber = stoi(parsedStrand[2]);

				if (strandStructure == mostVisited)
				{
					if (loop.size() > 0) 
					{
						int loopLength = loop.size();
						bool hasUniqueStructure = false;

						for (int i = 0; i < loopLength; ++i)
						{
							if (_db[str_hash(loop[i].first)].second <= _interestingNumber)
								hasUniqueStructure = true;
						}

						for (int i = 0; i < loopLength; ++i) 
						{
							if (hasUniqueStructure) {
								tempFile << _db[str_hash(loop[i].first)].first.csvFromStructure() << ", " << to_string(loop[i].second) << endl;
							} else {
								if (_db[str_hash(loop[i].first)].second == 1) {
									_db.erase(str_hash(loop[i].first));
								} else {
									_db[str_hash(loop[i].first)].second--;
								}
							}
						}

						tempFile << _db[str_hash(strandStructure)].first.csvFromStructure() << ", " << to_string(originalLineNumber) << endl;

						loop.clear();
					} else {
						loop.push_back(make_pair(strandStructure, originalLineNumber));
					}
				} else {
					if (loop.size() > 0)
					{
						loop.push_back(make_pair(strandStructure, originalLineNumber));
					} else {
						tempFile << _db[str_hash(strandStructure)].first.csvFromStructure() << ", " << to_string(originalLineNumber) << endl;
					}
				}
			}

			if (loop.size() > 0)
			{
				int loopLength = loop.size();
				for (int i = 0; i < loopLength; ++i)
				{
					tempFile << _db[str_hash(loop[i].first)].first.csvFromStructure() << ", " << loop[i].second << endl;
				}
			}
		} else {
			cout << "Error creating tmpfile" << endl;
		}

		// Recalculate the most visited structures
		mostVisitedStructures(structuresList);

		inputFile.close();
		tempFile.close();

		if (structuresList.size() == 0) {
			copyToFinalFile(i);
			break;
		}

		// remove(inFileName.c_str());

		++i;
	}

	convertToJSON();
}

void Filter::convertToJSON()
{
	string finalPrefix = "remove_loops_";
	string finalFile = finalPrefix.append(_fileName);
	string jsonFile = finalFile;
	jsonFile.erase(jsonFile.size()-4,string::npos).append(".json");

	ifstream finalFileStream;
	fstream jsonFileStream;

	finalFileStream.open(finalFile, fstream::in);
	jsonFileStream.open(jsonFile, fstream::out);

	if (finalFileStream.is_open() && jsonFileStream.is_open()) {
		string line;
		getline(finalFileStream, line);

		jsonFileStream << "{\n";

		string structureString = "\t\"structure\": \"";
		structureString.append(line);
		structureString.append("\",\n");
		jsonFileStream << structureString;

		getline(finalFileStream, line);

		string initialStructureString = "\t\"initial_structure\": \"";
		initialStructureString.append(line);
		initialStructureString.append("\",\n");
		jsonFileStream << initialStructureString;

		jsonFileStream << "\t\"states\": [\n";

		while (getline(finalFileStream, line)) {
			string strandObject = "\t\t{\n";
			strandObject.append("\t\t\t\"structure\": ");

			std::vector<std::string> v;
			split(line, ',', v);

			strandObject.append("\"");
			strandObject.append(v[0]);
			strandObject.append("\"");
			strandObject.append(",\n");
			strandObject.append("\t\t\t\"energy\": ");
			strandObject.append(v[1]);
			strandObject.append("\n\t\t},\n");

			jsonFileStream << strandObject;
		}

		jsonFileStream << "\t]\n}";


	} else {
		cout << "Error opening files in JSON conversion" << endl;
	}
}

void Filter::copyToFinalFile(int i) 
{
	string inFileName = "tempFile" + to_string(i);
	string finalPrefix = "remove_loops_";
	string tmpName = finalPrefix.append(_fileName);
	std::fstream tempFile;
	std::ifstream inFile;

	cout << "Copying to final file from " << inFileName << endl;

	inFile.open(inFileName, fstream::in);
	tempFile.open(tmpName, fstream::out);

	tempFile << inFile.rdbuf();
}

struct countSorter 
{
	inline bool operator() (const pair<size_t, pair<Structure, int> > a, const pair<size_t, pair<Structure, int> > b)
	{
		return a.second.second > b.second.second;
	} 
};

void Filter::mostVisitedStructures(vector<Structure> &list)
{
	list.clear();

	vector<pair<size_t, pair<Structure, int> > > mapcopy(_db.begin(), _db.end());
	sort(mapcopy.begin(), mapcopy.end(), countSorter());

	vector<pair<size_t, pair<Structure, int> > >::iterator listIterator = mapcopy.begin();

	while (listIterator->second.second >= _numberOfFilters)
	{
		list.push_back(listIterator->second.first);

		++listIterator;
	}

	vector<Structure>::iterator iter;
	// Strip structures that we've already visited
	for (iter = list.begin(); iter != list.end(); ) {
		std::string visitedStructure = iter->structure;

		if (_filteredStructures.find(visitedStructure) == _filteredStructures.end() ) {
			// If we *haven't* already filtered by this structure
			_filteredStructures.insert(visitedStructure);
			break;
		} else {
			iter = list.erase(iter);
		}
	}

}

