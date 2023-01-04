import AmphiNavbar from '../../components/AmphiNavbar/AmphiNavbar.js'
import {Container, Table} from "reactstrap";
export default function ManageFish() {

    return (
        <div>
            <AmphiNavbar/>

            <div className="wrapper">
                <div className="page-header">
                    <div className="page-header-image"/>
                    <div className="content">
                        <Container>
                            <Table>
                            </Table>
                        </Container>
                    </div>
                </div>
            </div>
        </div>
   );
}