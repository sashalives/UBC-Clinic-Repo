/* filtering algorithm cpp file
 *
 * author: Sasha Heinen
 * Nov 12 2014
 */

#include <stdlib.h>
#include <stdio.h>
#include <algorithm>

#include "filtering.h"

using namespace std;

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
	string line;

	size_t hashedValue = 0;

	// strip header
	getline(_inputFile, line);
	_header = line+"\n";
	getline(_inputFile, line);
	_header.append(line+"\n");

	while (getline(_inputFile, line)) {

		hashedValue = str_hash(line);

		// change this to hashed value later!
		it = _db.find(hashedValue);

		if (it == _db.end()) {
			// key is not in the database
			_db.insert(make_pair(hashedValue, make_pair(line, 1)));

		} else {
			// key is in the database
			_db[hashedValue].second++;
		}

	}

	_inputFile.close();

	cout << "Finished building database" << endl;
	cout << "File contains " << to_string(_db.size()) << " unique structures." << endl;

	filter();
}

void Filter::filter()
{
	cout << "Filtering..." << endl;

	vector<string> structuresList(_numberOfFilters); 
	mostVisitedStructures(structuresList);

	ifstream inputFile;
	fstream tempFile;
	string inFileName;
	string tmpName;

	for (int i=0; i<_numberOfFilters; ++i) {

		if (i==0)
			inFileName = _fileName;
		else
			inFileName = "tempFile" + to_string(i-1);

		if (i==(_numberOfFilters-1))
			tmpName = "remove_loops_" + _fileName;
		else
			tmpName = "tempFile" + to_string(i);

		inputFile.open(inFileName, fstream::in);
		tempFile.open(tmpName, fstream::out);

		string mostVisited = structuresList[i];

		cout << "Filtering for " << mostVisited << endl;
		it = _db.find(str_hash(mostVisited));
		cout << "Visited " << to_string(it->second.second) << " times" << endl;

		if (inputFile.is_open() && tempFile.is_open()) 
		{
			string line;

			vector<string> loop;

			// strip header again
			getline(inputFile, line);
			tempFile << line << endl;
			getline(inputFile, line);
			tempFile << line << endl;

			while (getline(inputFile, line))
			{
				if (line == mostVisited)
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
								tempFile << loop[i] << endl;
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
						loop.push_back(line);
					}
				} else {
					if (loop.size() > 0)
					{
						loop.push_back(line);
					} else {
						tempFile << line << endl;
					}
				}
			}

			if (loop.size() > 0)
			{
				int loopLength = loop.size();
				for (int i = 0; i < loopLength; ++i)
				{
					tempFile << loop[i] << "\n";
				}
			}
		} else {
			cout << "Error creating tmpfile" << endl;
		}

		inputFile.close();
		tempFile.close();

		if (i > 0) remove(inFileName.c_str());
	}

}

size_t Filter::hash(string structure)
{
	// NOTE: not used, currently using default c++ string hashing function
	return 10;
}

struct countSorter 
{
	inline bool operator() (const pair<size_t, pair<string, int> > a, const pair<size_t, pair<string, int> > b)
	{
		return a.second.second > b.second.second;
	} 
};

void Filter::mostVisitedStructures(vector<string> &list)
{

	vector<pair<size_t, pair<string, int> > > mapcopy(_db.begin(), _db.end());
	sort(mapcopy.begin(), mapcopy.end(), countSorter());

	for (int i=0; i < _numberOfFilters; ++i) {
		list[i] = mapcopy[i].second.first;
	}

}

