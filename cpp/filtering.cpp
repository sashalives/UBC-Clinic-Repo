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

	while (getline(_inputFile, line)) {

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
	int listSize = structuresList.size();

	cout << "filtering " << to_string(listSize) << " structures" << endl;

	ifstream inputFile;
	fstream tempFile;
	string inFileName;
	string tmpName;

	for (int i=0; i<listSize; ++i) {

		if (i==0)
			inFileName = _fileName;
		else
			inFileName = "tempFile" + to_string(i-1);

		if (i==(listSize-1)) {
			string finalPrefix = "remove_loops_";
			tmpName = finalPrefix.append(_fileName);
		} else
			tmpName = "tempFile" + to_string(i);

		inputFile.open(inFileName, fstream::in);
		tempFile.open(tmpName, fstream::out);

		string mostVisited = structuresList[i].structure;

		cout << "Filtering for " << mostVisited << endl;
		it = _db.find(str_hash(mostVisited));
		cout << "Visited " << to_string(it->second.second) << " times" << endl;

		if (inputFile.is_open() && tempFile.is_open()) 
		{
			std::string line;

			vector<string> loop;

			getline(inputFile, line);

			if (i==0) {
				// strip long header
				while (line.find("Count") != std::string::npos) {
					getline(inputFile, line);
				}
			}

			// write nucleotide sequence to tempfile
			tempFile << line << endl;

			// strip initial structure header
			getline(inputFile, line);

			tempFile << line << endl;

			while (getline(inputFile, line))
			{

				std::vector<std::string> parsedStrand;
				split(line, ',', parsedStrand);	
				string strandStructure = parsedStrand[0];

				if (strandStructure == mostVisited)
				{
					if (loop.size() > 0) 
					{
						int loopLength = loop.size();
						bool hasUniqueStructure = false;

						for (int i = 0; i < loopLength; ++i)
						{
							if (_db[str_hash(loop[i])].second <= _interestingNumber)
								hasUniqueStructure = true;
						}

						for (int i = 0; i < loopLength; ++i) 
						{
							if (hasUniqueStructure) {
								tempFile << _db[str_hash(loop[i])].first.csvFromStructure() << endl;
							} else {
								if (_db[str_hash(loop[i])].second == 1) {
									_db.erase(str_hash(loop[i]));
								} else {
									_db[str_hash(loop[i])].second--;
								}
							}
						}

						loop.clear();
					} else {
						loop.push_back(strandStructure);
					}
				} else {
					if (loop.size() > 0)
					{
						loop.push_back(strandStructure);
					} else {
						tempFile << _db[str_hash(strandStructure)].first.csvFromStructure() << endl;
					}
				}
			}

			if (loop.size() > 0)
			{
				int loopLength = loop.size();
				for (int i = 0; i < loopLength; ++i)
				{
					tempFile << _db[str_hash(loop[i])].first.csvFromStructure() << "\n";
				}
			}
		} else {
			cout << "Error creating tmpfile" << endl;
		}

		inputFile.close();
		tempFile.close();

		if (i > 0) remove(inFileName.c_str());
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

size_t Filter::hash(string structure)
{
	// NOTE: not used, currently using default c++ string hashing function
	return 10;
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

	vector<pair<size_t, pair<Structure, int> > > mapcopy(_db.begin(), _db.end());
	sort(mapcopy.begin(), mapcopy.end(), countSorter());

	vector<pair<size_t, pair<Structure, int> > >::iterator listIterator = mapcopy.begin();

	// for (int i=0; i < _numberOfFilters; ++i) {
	// 	list[i] = mapcopy[i].second.first;
	// }

	while (listIterator->second.second >= _numberOfFilters)
	{
		list.push_back(listIterator->second.first);

		++listIterator;
	}

}

