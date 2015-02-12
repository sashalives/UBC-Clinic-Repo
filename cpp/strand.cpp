/* structure information container implementation
 *
 * author: Sasha Heinen
 * Dec 8 2014
 */

#include "strand.h"

using namespace std;

Structure::Structure(string const structure, float const energy)
	:structure(structure), energy(energy)
{

}

string Structure::csvFromStructure()
{
	return structure + ", " + to_string(energy);
}
