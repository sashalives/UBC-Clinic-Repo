/* filtering algorithm header file
 *
 * author: Sasha Heinen
 * Nov 12 2014
 */

#include <map>
#include <string>
#include <vector>
#include <functional>
#include <iostream>
#include <fstream>
#include "strand.h"

using namespace std;

class Filter 
{
public:

	Filter(const char * fileName);

	void runFiltering(int numberOfFilters, int interestingNumber);

private:
	int _numberOfFilters;
	int _interestingNumber;

	std::hash<std::string> str_hash;

	const char *_fileName;
	ifstream _inputFile;
	string _header;
	string _initialStructure;

	std::map<size_t, pair<Structure, int> > _db;
	map<size_t, pair<Structure, int> >::iterator it;
	
	void buildDB();
	void filter();

	void convertToJSON();

	size_t hash(string structure);
	void mostVisitedStructures(vector<Structure> &list);
	// bool countSort(pair<string, pair<string, int> > a, pair<string, pair<string, int> > b);
	void fileCopy(string src, string dst);

};
