/* structure information container header
 *
 * author: Sasha Heinen
 * Dec 8 2014
 */

#include <string>

using namespace std;

class Structure
{
public:

	Structure(string const structure, float const energy);

	Structure(){};

	string csvFromStructure();

	string structure;
	float energy;

private:


};
